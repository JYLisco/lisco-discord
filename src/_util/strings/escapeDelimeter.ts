export const escapeAllDelimiters = (inputs: Array<string>): string[] => {
  // Map each input string to its escaped version using the escapeDelimiter() function
  const escapedInputs = inputs.map((input) => escapeDelimiter(input));

  // Return the new array with the escaped strings
  return escapedInputs;
};

export const escapeDelimiter = (input: string): string => {
  // Find the index of the first delimiter in the input string
  const firstDelimiterIndex = input.indexOf('```');
  // Find the index of the last delimiter in the input string
  const lastDelimiterIndex = input.lastIndexOf('```');

  // If there are no delimiters or the first delimiter is not at the beginning, return the original string
  if (
    firstDelimiterIndex !== 0 ||
    lastDelimiterIndex < firstDelimiterIndex + 2
  ) {
    return input;
  }

  // Extract the text between the first and last delimiters
  const escapedStr = input
    .slice(firstDelimiterIndex + 3, lastDelimiterIndex)
    // Replace all but the first and last delimiters with an escaped version
    .replace(/```/g, '[CODE_DELIMITER]');

  // Build and return the final string with the original delimiters and the escaped text in between
  return (
    input.slice(0, firstDelimiterIndex + 3) +
    escapedStr +
    input.slice(lastDelimiterIndex)
  );
};
