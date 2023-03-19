export const mergeArray = (array: Array<string>): Array<string> => {
  /* Initializes a new array with only the first element of the input array */
  let mergedResult = [array[0]];

  /* Stores the length of the first element as the current length */
  let currentLength = array[0].length;

  /* Loops over the remaining elements of the input array starting from index 1 */
  for (let i = 1; i < array.length; i++) {
    /* Gets the current line from the input array */
    const line = array[i];

    /* If adding this line to the current result would exceed Discord's 2000 character limit,
    add it as a new element of the result array and reset the current length counter */
    if (currentLength + line.length + 1 > 2000) {
      mergedResult.push(line);
      currentLength = line.length;
    } else {
      /* Otherwise, append the line to the last element of the result array with a newline separator,
    and update the current length counter accordingly */
      mergedResult[mergedResult.length - 1] += '\n' + line;
      currentLength += line.length + 1;
    }
  }

  /* Filters out any empty or whitespace-only strings from the result array */
  return mergedResult;
};
