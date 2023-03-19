import {
  OpenAIApi,
  Configuration,
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from 'openai';
import { AppLogger, Loggers } from '../resources/appLogger';
import { CustomStrings } from '../../constants/strings';

export class OpenAiClient {
  private static instance: OpenAiClient;
  private openai: OpenAIApi;
  private logger: AppLogger;

  private constructor() {
    this.logger = AppLogger.getInstance();
    /* Initialize the OpenAIAPI with the .env API Key */
    this.openai = new OpenAIApi(
      new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      })
    );
  }

  static getInstance(): OpenAiClient {
    if (!OpenAiClient.instance) {
      OpenAiClient.instance = new OpenAiClient();
    }
    return OpenAiClient.instance;
  }

  async chat(
    messageLog: Array<ChatCompletionRequestMessage>
  ): Promise<ChatCompletionResponseMessage | undefined> {
    this.logger.info(Loggers.App, 'Attempting to hit ChatGPT Api...');
    const response = await this.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messageLog,
    });

    /* Break the response into an array of strings for threading. */
    const content = response.data.choices[0].message;

    this.logger.info(Loggers.Api, `Response${CustomStrings.Divider}`);
    this.logger.info(Loggers.Api, content?.content);
    this.logger.info(Loggers.Api, `END Response${CustomStrings.Divider}`);

    return content;
  }
}
