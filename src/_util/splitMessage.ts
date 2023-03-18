export const splitMessage = (input: string): Array<string> => {
  /* Initialize an empty array to hold the result */
  let result: string[] = [];

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
      } else {
        /* Otherwise, start a new code block */
        codeBlock = line + '\n';
      }
    } else if (codeBlock) {
      /* If there's a code block in progress, add the line to it */
      codeBlock += line + '\n';
    } else {
      /* Otherwise, add the line to the result array as normal */
      result.push(line);
    }
  });

  /* If there's still a code block in progress at the end, add it to the result array */
  if (codeBlock) {
    result.push(codeBlock);
  }

  /* Filter out any empty entries in the result array */
  return result.filter((entry) => entry !== '');
};

export const splitMessage_old = (input: string): Array<string> => {
  const lines = input.split('\n');
  const result = [];
  let currentBlock: Array<string> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('```')) {
      let escapedLine = line;
      let delimiterPos = line.indexOf('```');
      while (delimiterPos !== -1) {
        if (delimiterPos > 0 && line[delimiterPos - 1] !== '`') {
          // Replace ``` with ``` in the middle of code blocks with \`\`\`
          if (currentBlock !== null) {
            escapedLine =
              escapedLine.slice(0, delimiterPos) +
              '\\`\\`\\`' +
              escapedLine.slice(delimiterPos + 3);
            delimiterPos += 3;
          } else {
            escapedLine =
              escapedLine.slice(0, delimiterPos) +
              '`' +
              escapedLine.slice(delimiterPos);
          }
        }
        delimiterPos = escapedLine.indexOf('```', delimiterPos + 1);
      }

      if (escapedLine.trim().startsWith('```')) {
        if (currentBlock !== null) {
          result.push(escapedLine + currentBlock.join('\n') + '```');
          currentBlock = null;
        } else {
          currentBlock = [];
        }
      } else {
        if (currentBlock !== null) {
          currentBlock.push(escapedLine);
        } else {
          result.push(escapedLine);
        }
      }
    } else {
      if (currentBlock !== null) {
        currentBlock.push(line);
      } else {
        result.push(line);
      }
    }
  }

  if (currentBlock !== null) {
    result.push('```' + currentBlock.join('\n') + '```');
  }

  return result;
};
