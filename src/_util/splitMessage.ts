export const splitMessage = (input: string): Array<string> => {
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
