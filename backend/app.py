# z:\te1.0 - Copy\backend\app.py
from flask import Flask, request, jsonify
# Removed OR-Tools import as we are using a heuristic approach for now
# from ortools.sat.python import cp_model
import json
from datetime import datetime, timedelta, time
from flask_cors import CORS
import logging
import firebase_admin
from firebase_admin import credentials, firestore
import os

# --- Firebase Admin SDK Initialization ---
try:
    # Assumes serviceAccountKey.json is in the same directory as app.py
    key_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
    if not os.path.exists(key_path):
        raise FileNotFoundError("serviceAccountKey.json not found in the backend directory.")

    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger = logging.getLogger(__name__) # Define logger after potential errors
    logger.info("Firebase Admin SDK initialized successfully.")
except Exception as e:
    # Log error during initialization and exit or handle gracefully
    logging.basicConfig(level=logging.ERROR) # Ensure logging is configured even if init fails
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
    # Depending on requirements, you might want to exit the app
    # raise SystemExit("Firebase initialization failed.") # Or handle differently
    db = None # Ensure db is None if initialization fails

# Set up logging (ensure it's configured)
logging.basicConfig(level=logging.DEBUG)
if 'logger' not in locals(): # Define logger if not defined during exception handling
    logger = logging.getLogger(__name__)

app = Flask(__name__)
# Allow requests from your frontend development server
CORS(app, resources={r"/*": {"origins": "http://localhost:5173", "methods": ["GET", "POST", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type"], "supports_credentials": True}})

# --- Helper Function to Parse Time ---
def parse_time_string(time_str):
    """Parses HH:MM string to datetime.time object."""
    try:
        return datetime.strptime(time_str, "%H:%M").time()
    except (ValueError, TypeError):
        logger.warning(f"Could not parse time string: {time_str}. Returning None.")
        return None

# --- Helper Function for Employee Availability ---
def get_employee_availability(employee_data, target_date):
    """
    Calculates available hours and start/end times for an employee on a specific date.
    Returns: Tuple (available_hours, start_time_obj, end_time_obj) or (0, None, None)
    """
    day_of_week = target_date.weekday() # Monday is 0, Sunday is 6

    for pattern in employee_data.get("availabilityPatterns", []):
        pattern_days = pattern.get("days", [])
        # Ensure pattern_days contains integers
        if not all(isinstance(d, int) for d in pattern_days):
            logger.warning(f"Skipping availability pattern with non-integer days for employee {employee_data.get('empId')}")
            continue

        if pattern.get("type") == "weekly" and day_of_week in pattern_days:
            start_str = pattern.get("startTime")
            end_str = pattern.get("endTime")
            start_time_obj = parse_time_string(start_str)
            end_time_obj = parse_time_string(end_str)

            if start_time_obj and end_time_obj:
                # Calculate duration in hours
                start_dt = datetime.combine(target_date.date(), start_time_obj)
                end_dt = datetime.combine(target_date.date(), end_time_obj)
                if end_dt <= start_dt: # Handle overnight or invalid times
                     logger.warning(f"End time {end_str} is not after start time {start_str} for employee {employee_data.get('empId')}. Assuming 0 availability for this pattern.")
                     continue # or adjust logic for overnight shifts if needed
                duration = (end_dt - start_dt).total_seconds() / 3600
                return duration, start_time_obj, end_time_obj

    logger.debug(f"No matching availability pattern found for employee {employee_data.get('empId', 'N/A')} on {target_date.strftime('%Y-%m-%d')}")
    return 0, None, None

# --- Multi-Day Task Assignment Logic (Heuristic) ---
@app.route('/assign-task', methods=['POST', 'OPTIONS'])
def assign_task_route():
    if request.method == "OPTIONS":
        # Handle CORS preflight request
        response = jsonify(success=True)
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    if db is None:
         return jsonify({"error": "Database connection not available"}), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        task_data = data.get('task')
        # Assume orgId is passed with the task or inferred contextually
        org_id = task_data.get('orgId', 'default-org') # Get orgId from task or use default

        if not task_data:
            return jsonify({"error": "Task data missing"}), 400
        if 'taskId' not in task_data:
            return jsonify({"error": "Task ID missing"}), 400

        task_duration_hours = float(task_data.get("estimatedDurationHours", 0))
        task_required_skills = [skill.get("skillName") for skill in task_data.get("requiredSkills", []) if skill.get("skillName")]
        # Use task start date if provided, otherwise fallback to today
        task_start_date_str = task_data.get("start")
        try:
             # Try parsing ISO format with timezone Z or +HH:MM
             if task_start_date_str:
                 if task_start_date_str.endswith('Z'):
                     task_start_date = datetime.fromisoformat(task_start_date_str.replace('Z', '+00:00')).date()
                 else:
                     task_start_date = datetime.fromisoformat(task_start_date_str).date()
             else:
                 task_start_date = datetime.now().date() # Fallback to today
        except ValueError:
             logger.error(f"Invalid start date format: {task_start_date_str}. Falling back to today.")
             task_start_date = datetime.now().date()


        logger.debug(f"Assigning task: {task_data.get('title', 'N/A')}, Duration: {task_duration_hours}h, Skills: {task_required_skills}, Start Date: {task_start_date}")

        if task_duration_hours <= 0:
             return jsonify({"error": "Task duration must be positive"}), 400

        # 1. Fetch Employees from Firestore for the specific org
        employees_ref = db.collection('organizations').document(org_id).collection('employees')
        all_employees_docs = employees_ref.stream()
        all_employees = []
        for doc in all_employees_docs:
             emp_data = doc.to_dict()
             emp_data['empId'] = doc.id # Add Firestore document ID as empId
             all_employees.append(emp_data)

        if not all_employees:
            return jsonify({"error": f"No employees found for organization {org_id}"}), 404

        # 2. Filter Employees by Skill
        suitable_employees = []
        for emp in all_employees:
            emp_skills = [skill.get("skillName") for skill in emp.get("skills", []) if skill.get("skillName")]
            # Check if employee has ALL required skills (or if no skills are required)
            if not task_required_skills or all(req_skill in emp_skills for req_skill in task_required_skills):
                suitable_employees.append(emp)

        if not suitable_employees:
            return jsonify({"error": "No employees found with the required skills"}), 404
        logger.debug(f"Found {len(suitable_employees)} suitable employees.")

        # 3. Select Employee (Heuristic: First suitable available employee)
        assigned_employee = None
        schedule_result = []
        remaining_duration_hours = task_duration_hours
        current_date = task_start_date

        # Iterate through suitable employees to find the first one who can complete the task
        for employee in suitable_employees:
            logger.debug(f"Checking availability for employee: {employee.get('name', 'N/A')} (ID: {employee.get('empId')})")
            schedule_result = [] # Reset schedule for this employee attempt
            remaining_duration_hours = task_duration_hours
            current_date = task_start_date
            possible = True

            # Simulate day by day assignment
            days_checked = 0
            max_days_to_check = 30 # Limit search to avoid infinite loops
            while remaining_duration_hours > 1e-6 and days_checked < max_days_to_check: # Use tolerance for float comparison
                 daily_available_hours, day_start_time, day_end_time = get_employee_availability(employee, current_date)
                 logger.debug(f"  Date: {current_date}, Available: {daily_available_hours}h, Start: {day_start_time}, End: {day_end_time}")

                 if daily_available_hours > 0 and day_start_time and day_end_time:
                      # Calculate work hours for this day
                      work_hours_today = min(remaining_duration_hours, daily_available_hours)

                      # Calculate actual start and end time for the work block
                      work_start_datetime = datetime.combine(current_date, day_start_time)
                      work_end_datetime = work_start_datetime + timedelta(hours=work_hours_today)

                      # Ensure work end time doesn't exceed daily availability end time
                      day_end_datetime = datetime.combine(current_date, day_end_time)
                      if work_end_datetime > day_end_datetime:
                          # This case might happen if rounding causes issues or logic error
                          logger.warning(f"Calculated work end time {work_end_datetime} exceeds day end time {day_end_datetime}. Adjusting.")
                          work_hours_today = (day_end_datetime - work_start_datetime).total_seconds() / 3600
                          work_end_datetime = day_end_datetime
                          if work_hours_today <= 0:
                              logger.debug(f"    No effective work time possible on {current_date} within bounds.")
                              current_date += timedelta(days=1)
                              days_checked += 1
                              continue


                      schedule_result.append({
                          "date": current_date.isoformat(),
                          "startTime": work_start_datetime.strftime("%H:%M"),
                          "endTime": work_end_datetime.strftime("%H:%M"),
                          "hoursWorked": round(work_hours_today, 2)
                      })
                      remaining_duration_hours -= work_hours_today
                      logger.debug(f"    Scheduled {work_hours_today:.2f}h on {current_date}. Remaining: {remaining_duration_hours:.2f}h")

                 else:
                     logger.debug(f"    Not available on {current_date}")

                 # Move to the next day only if work was done or employee wasn't available
                 current_date += timedelta(days=1)
                 days_checked += 1

            # Check if the task was fully scheduled within the max_days limit
            if remaining_duration_hours <= 1e-6:
                 assigned_employee = employee
                 logger.info(f"Successfully scheduled task for employee {assigned_employee.get('name')} (ID: {assigned_employee.get('empId')})")
                 break # Found a suitable employee and schedule
            else:
                 logger.debug(f"Could not fully schedule task for {employee.get('name')} within {max_days_to_check} days. Remaining: {remaining_duration_hours:.2f}h")
                 # Reset for next employee attempt
                 schedule_result = []


        # 4. Return Result
        if assigned_employee and schedule_result:
            response_data = {
                "taskId": task_data['taskId'],
                "employeeId": assigned_employee['empId'],
                "employeeName": assigned_employee.get('name', 'N/A'),
                "schedule": schedule_result # List of daily work blocks
            }
            # --- TODO: Save the assignment/schedule to Firestore if needed ---
            # Example: db.collection(...).document(task_data['taskId']).set({"assignment": response_data})
            return jsonify(response_data)
        elif days_checked >= max_days_to_check :
             logger.warning(f"Task assignment failed: Could not schedule task within {max_days_to_check} days for any suitable employee.")
             return jsonify({"error": f"Could not schedule task within {max_days_to_check} days."}), 409 # Conflict or impossible
        else:
             logger.warning("Task assignment failed: No suitable employee found or could not complete schedule.")
             return jsonify({"error": "No suitable employee available to complete the task within the checked timeframe."}), 404


    except Exception as e:
        logger.exception(f"Error during task assignment: {e}") # Log full traceback
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


# --- Delete Endpoints ---
@app.route('/employees/<org_id>/<employee_id>', methods=['DELETE'])
def delete_employee(org_id, employee_id):
     if db is None:
         return jsonify({"error": "Database connection not available"}), 503
     try:
        logger.info(f"Attempting to delete employee {employee_id} from org {org_id}")
        emp_ref = db.collection('organizations').document(org_id).collection('employees').document(employee_id)
        doc = emp_ref.get()
        if doc.exists:
            emp_ref.delete()
            logger.info(f"Employee {employee_id} deleted successfully.")
            # Consider deleting related tasks or reassigning them here if necessary
            return jsonify({"message": f"Employee {employee_id} deleted successfully"}), 200
        else:
            logger.warning(f"Employee {employee_id} not found for deletion.")
            return jsonify({"error": "Employee not found"}), 404
     except Exception as e:
        logger.error(f"Error deleting employee {employee_id}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/tasks/<org_id>/<task_id>', methods=['DELETE'])
def delete_task(org_id, task_id):
     if db is None:
         return jsonify({"error": "Database connection not available"}), 503
     try:
        logger.info(f"Attempting to delete task {task_id} from org {org_id}")
        # Assuming tasks are stored under organization or maybe a global 'tasks' collection
        # Adjust the path based on your Firestore structure
        # Example: tasks stored directly under organization
        task_ref = db.collection('organizations').document(org_id).collection('tasks').document(task_id)
        # Example: tasks stored globally with an orgId field
        # task_ref = db.collection('tasks').document(task_id) # (Need query to ensure orgId matches if stored globally)

        doc = task_ref.get()
        if doc.exists:
             # Optional: Check if task belongs to the specified org_id if tasks are global
             # task_data = doc.to_dict()
             # if task_data.get('orgId') != org_id:
             #     return jsonify({"error": "Task does not belong to this organization"}), 403
            task_ref.delete()
            logger.info(f"Task {task_id} deleted successfully.")
            return jsonify({"message": f"Task {task_id} deleted successfully"}), 200
        else:
            logger.warning(f"Task {task_id} not found for deletion.")
            return jsonify({"error": "Task not found"}), 404
     except Exception as e:
        logger.error(f"Error deleting task {task_id}: {e}")
        return jsonify({"error": str(e)}), 500


# --- Main Execution ---
if __name__ == '__main__':
    # Use waitress or gunicorn for production instead of Flask's dev server
    # For development:
    app.run(debug=True, port=5000, host='0.0.0.0') # Listen on all interfaces for easier access from frontend container/VM if needed