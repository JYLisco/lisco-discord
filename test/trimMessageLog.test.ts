import { ChatCompletionRequestMessage } from 'openai';
import { trimMessageLog } from '../src/_util/openai/gpt/trimMessageLog';
import { encode } from 'gpt-3-encoder';

describe('trimMessageLog', () => {
  const userMessage: ChatCompletionRequestMessage = {
    role: 'user',
    content: 'Hello, world!',
  };
  const assistantMessage: ChatCompletionRequestMessage = {
    role: 'assistant',
    content: 'Hi there, how can I help you today?',
  };
  const systemMessage: ChatCompletionRequestMessage = {
    role: 'system',
    content: 'Sorry, I did not understand your request.',
  };

  it('returns the original message log if it is within the token limit', () => {
    const messageLog: ChatCompletionRequestMessage[] = [
      userMessage,
      assistantMessage,
      systemMessage,
    ];
    const maxTokenCount = encode(
      messageLog.map((message) => message.content).join('')
    ).length;
    expect(trimMessageLog(messageLog, maxTokenCount)).toEqual(messageLog);
  });

  it('removes non-system messages until total tokens is within the limit, sysem only response', () => {
    const messageLog: ChatCompletionRequestMessage[] = [
      userMessage,
      assistantMessage,
      assistantMessage,
      userMessage,
      systemMessage,
      assistantMessage,
    ];
    const maxTokenCount = encode(systemMessage.content).length;
    expect(trimMessageLog(messageLog, maxTokenCount)).toEqual([systemMessage]);
  });

  it('removes non-system messages until total tokens is within the limit', () => {
    const messageLog: ChatCompletionRequestMessage[] = [
      systemMessage,
      userMessage,
      assistantMessage,
      assistantMessage,
      userMessage,
    ];
    const maxTokenCount = encode(
      systemMessage.content + userMessage.content + assistantMessage.content
    ).length;
    expect(trimMessageLog(messageLog, maxTokenCount)).toEqual([
      systemMessage,
      assistantMessage,
      userMessage,
    ]);
  });

  it('throws an error if the system messages exceed the token limit', () => {
    const messageLog: ChatCompletionRequestMessage[] = [
      systemMessage,
      systemMessage,
      systemMessage,
    ];
    const maxTokenCount = encode(systemMessage.content).length * 2 - 1;
    expect(() => trimMessageLog(messageLog, maxTokenCount)).toThrow();
  });
});
