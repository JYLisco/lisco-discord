import { escapeAllDelimiters } from '../strings/escapeDelimeter';
import { mergeArray } from '../strings/mergeArray';
import { splitMessage } from '../strings/splitMessage';

export const processTextForDiscord = (input: string): Array<string> => {
  return mergeArray(escapeAllDelimiters(splitMessage(input)));
};
