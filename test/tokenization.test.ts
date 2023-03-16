import { encode, decode } from 'gpt-3-encoder';

describe('GPT-3 Encoder', () => {
  test('encode returns an array of tokens', () => {
    const str = 'This is an example sentence to try encoding out on!';
    const encoded = encode(str);

    expect(Array.isArray(encoded)).toBe(true);
    expect(typeof encoded[0]).toBe('number');
  });

  test('decode returns the original encoded string', () => {
    const str = 'This is an example sentence to try encoding out on!';
    const encoded = encode(str);
    const decoded = decode(encoded);

    expect(decoded).toBe(str);
  });
});
