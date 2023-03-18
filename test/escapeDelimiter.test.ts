import { escapeDelimiter } from '../src/_util/escapeDelimeter';

describe('escapeDelimiter', () => {
  it('returns original string if no delimiters', () => {
    const input = 'some text';
    const result = escapeDelimiter(input);
    expect(result).toEqual(input);
  });

  it('returns original string if first delimiter not at beginning', () => {
    const input = 'some ``` code ``` block';
    const result = escapeDelimiter(input);
    expect(result).toEqual(input);
  });

  it('returns original string if only one delimiter', () => {
    const input = '``` some code block ```';
    const result = escapeDelimiter(input);
    expect(result).toEqual(input);
  });

  it('escapes delimiters properly', () => {
    const input = '``` some ``` code ``` block ```';
    const expected =
      '``` some [CODE_DELIMITER] code [CODE_DELIMITER] block ```';
    const result = escapeDelimiter(input);
    expect(result).toEqual(expected);
  });

  it('escapes multiple code blocks properly', () => {
    const input =
      '``` some ``` code ``` block ``` and ``` another ``` block ```';
    const expected =
      '``` some [CODE_DELIMITER] code [CODE_DELIMITER] block [CODE_DELIMITER] and [CODE_DELIMITER] another [CODE_DELIMITER] block ```';
    const result = escapeDelimiter(input);
    expect(result).toEqual(expected);
  });
});
