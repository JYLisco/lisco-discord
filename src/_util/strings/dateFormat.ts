export const formatDate = (date: Date): string => {
  // Get Month, Day and Year values
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // Get Hours, Minutes and Seconds values
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Determine if it's AM or PM
  const amPm = hours < 12 ? 'AM' : 'PM';

  // Convert to 12-hour format
  hours = hours % 12 || 12;

  // Format the datetime string
  const formattedDateTime = `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${amPm}`;

  return formattedDateTime;
};
