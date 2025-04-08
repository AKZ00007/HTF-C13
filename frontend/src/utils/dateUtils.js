export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  export const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  export const getWorkingHours = () => {
    const hours = [];
    for (let i = 9; i < 24; i++) {
      hours.push({
        hour: i,
        label: `${i > 12 ? i - 12 : i}${i >= 12 ? 'pm' : 'am'}`,
      });
    }
    for (let i = 0; i < 4; i++) {
      hours.push({
        hour: i,
        label: `${i === 0 ? 12 : i}am`,
      });
    }
    return hours;
  };
  
  export const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };