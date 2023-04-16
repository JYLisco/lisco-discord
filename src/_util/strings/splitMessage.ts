export const splitMessage = (input: string): Array<string> => {
  /* Initialize an empty array to hold the result */
  let result: string[] = [];

  var firstLine = '';
  /* Initialize an empty string to hold any current code block */
  let codeBlock = '';

  /* Split the input string into an array of lines, and iterate over each line */
  input.split('\n').forEach((line) => {
    /* If the line starts with a code block delimiter, handle it */
    if (line.trim().startsWith('```')) {
      /* If there's already a code block in progress, add it to the result array and clear it */
      if (codeBlock) {
        codeBlock += line;
        result.push(codeBlock);
        codeBlock = '';
        firstLine = '';
      } else {
        /* Otherwise, start a new code block */
        codeBlock = line + '\n';
        firstLine = codeBlock;
      }
    } else if (codeBlock) {
      /* If there's a code block in progress, check if adding the line will exceed the maximum length */
      if ((codeBlock + line + '\n').length > 2000) {
        /* Close existing code block if it exceeded the maximum length, and add it to the result array */
        codeBlock += '```\n';
        result.push(codeBlock.trim());

        /* Start a new code block with the current line */
        codeBlock = firstLine + line + '\n';
      } else {
        /* If the line fits within the maximum length, add it to the code block */
        codeBlock += line + '\n';
      }
    } else {
      /* Otherwise, add the line to the result array as normal */
      splitAndPush(result, line);
    }
  });

  /* If there's still a code block in progress at the end, add it to the result array */
  if (codeBlock) {
    result.push(codeBlock);
  }

  /* Filter out any empty entries in the result array */
  return result;
};

const splitAndPush = (result: string[], line: string, maxChars = 2000) => {
  // If the line is within the maximum character limit, push it and return
  if (line.length <= maxChars) {
    result.push(line);
    return;
  }

  // Find a suitable split point by looking for the last period
  let splitPoint = maxChars;

  // Start from the maximum character limit and go backwards
  for (let i = maxChars; i >= 0; i--) {
    // If it's a period and not part of a number or acronym
    const prevCharCode = line.charCodeAt(i - 1);
    const nextCharCode = line.charCodeAt(i + 1);
    if (
      line[i] === '.' &&
      (isNaN(prevCharCode - 48) || isNaN(nextCharCode - 48)) &&
      line[i + 1] !== '.'
    ) {
      splitPoint = i + 1; // +1 to include the period in the first part
      break;
    }
  }

  // Push the substrings
  const firstPart = line.slice(0, splitPoint);
  const remainingPart = line.slice(splitPoint);

  result.push(firstPart);

  // Recurse for the remaining part
  splitAndPush(result, remainingPart, maxChars);
};
