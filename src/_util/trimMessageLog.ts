import { encode } from 'gpt-3-encoder';
import { ChatCompletionRequestMessage } from 'openai';

export const trimMessageLog = (
  messageLog: ChatCompletionRequestMessage[],
  maxTokenCount: number
): ChatCompletionRequestMessage[] => {
  let totalTokens = 0;
  let systemTokens = 0;
  let nonSystemTokens = 0;

  const systemMessages: ChatCompletionRequestMessage[] = [];
  const nonSystemMessages: ChatCompletionRequestMessage[] = [];

  // Iterate through the log from start to end, separating system and non-system messages
  for (let i = 0; i < messageLog.length; i++) {
    const { role, content } = messageLog[i];
    const messageTokens = encode(content).length;
    totalTokens += messageTokens;

    if (role === 'system') {
      systemMessages.push(messageLog[i]);
      systemTokens += messageTokens;
    } else {
      nonSystemMessages.push(messageLog[i]);
      nonSystemTokens += messageTokens;
    }
  }

  if (totalTokens <= maxTokenCount) {
    return messageLog;
  }

  // Reduce the maxTokenCount by the total tokens in the system messages
  maxTokenCount -= systemTokens;

  // If the new limit is negative, throw an error
  if (maxTokenCount < 0) {
    throw new Error('System messages are too long for the given token limit');
  }

  // Remove messages from the top of the non-system message array until their total token count is less than the token limit
  while (nonSystemMessages.length > 0 && nonSystemTokens > maxTokenCount) {
    const messageTokens = encode(nonSystemMessages.shift()!.content).length;
    nonSystemTokens -= messageTokens;
  }

  // Produce a new array with the system messages at the top and the remaining non-system messages appended
  const trimmedMessageLog = [...systemMessages, ...nonSystemMessages];

  return trimmedMessageLog;
};
