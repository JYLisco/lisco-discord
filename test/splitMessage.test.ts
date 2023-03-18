import { splitMessage } from '../src/_util/splitMessage';

describe('splitMessage', () => {
  it('should split regular text into an array of lines', () => {
    const input = 'Hello world\nThis is a test\n';
    const result = splitMessage(input);
    expect(result).toEqual(['Hello world', 'This is a test']);
  });

  it('should group code blocks into a single entry in the array', () => {
    const input =
      'Here is some code:\n```\nconst x = 10;\nconst y = 20;\nconsole.log(x + y);\n```\nHere is some regular text.';
    const result = splitMessage(input);
    expect(result).toEqual([
      'Here is some code:',
      '```\nconst x = 10;\nconst y = 20;\nconsole.log(x + y);\n```',
      'Here is some regular text.',
    ]);
  });
});
