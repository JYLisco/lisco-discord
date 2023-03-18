import { escapeAllDelimiters } from './escapeDelimeter';
import { mergeArray } from './mergeArray';
import { splitMessage } from './splitMessage';

export const processDiscordMessage = (input: string): Array<string> => {
  return mergeArray(escapeAllDelimiters(splitMessage(input)));
};
