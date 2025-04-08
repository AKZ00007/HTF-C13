export const eventsData = [
  {
    id: '1',
    title: 'Frontend Development Task', // Changed from "Working out" to a task
    start: new Date(2025, 3, 6, 10, 15).toISOString(),
    end: new Date(2025, 3, 6, 11, 30).toISOString(),
    type: 'task', // Changed from "workout" to "task"
    assignedTo: null,
    description: 'Develop new UI components using React and optimize performance.',
    requiredSkills: ['React', 'JavaScript'], // Skills required for this task
  },
  {
    id: '3',
    title: 'Design Review',
    start: new Date(2025, 3, 8, 14, 0).toISOString(),
    end: new Date(2025, 3, 8, 15, 30).toISOString(),
    type: 'meeting',
    assignedTo: '2', // Sarah Johnson (UI/UX Designer)
    description: 'Review the latest UI designs and gather feedback.',
    requiredSkills: [], // No skills required for meetings
  },
  {
    id: '4',
    title: 'Backend Sprint Planning',
    start: new Date(2025, 3, 9, 10, 0).toISOString(),
    end: new Date(2025, 3, 9, 12, 0).toISOString(),
    type: 'meeting',
    assignedTo: '3', // Michael Chen (Backend Developer)
    description: 'Plan the sprint tasks for the backend team.',
    requiredSkills: [], // No skills required for meetings
  },
  {
    id: '5',
    title: 'Product Roadmap Session',
    start: new Date(2025, 3, 10, 13, 0).toISOString(),
    end: new Date(2025, 3, 10, 16, 0).toISOString(),
    type: 'meeting',
    assignedTo: '4', // Emily Rodriguez (Product Manager)
    description: 'Discuss and finalize the product roadmap for Q2.',
    requiredSkills: [], // No skills required for meetings
  },
  {
    id: '6', // New task example
    title: 'Database Optimization Task',
    start: new Date(2025, 3, 11, 9, 0).toISOString(),
    end: new Date(2025, 3, 11, 11, 0).toISOString(),
    type: 'task',
    assignedTo: null,
    description: 'Optimize PostgreSQL queries and improve database performance.',
    requiredSkills: ['PostgreSQL', 'Python'], // Skills required for this task
  },
];