import {
  OpenAIApi,
  Configuration,
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  ImagesResponseDataInner,
} from 'openai';
import { AppLogger, Loggers } from '../resources/appLogger';
import { CustomStrings } from '../../constants/strings';
import { ImageAspectRatios } from '../../constants/openai';

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

  async flagged(prompt: string): Promise<boolean> {
    this.logger.info(
      Loggers.App,
      `Attempting to hit OpenAi Moderation Api with prompt '${prompt}'...`
    );

    const response = await this.openai.createModeration({
      input: prompt,
    });

    /* Break the response into an array of strings for threading. */
    const result = response.data.results[0].flagged;

    if (result) {
      this.logger.info(Loggers.App, `Prompt violates moderation guidelines.`);
    } else {
      this.logger.info(
        Loggers.App,
        `Prompt does not violate moderation guidelines.`
      );
    }

    return result;
  }

  async image(
    prompt: string,
    n?: number,
    aspect?: 'Small' | 'Medium' | 'Large'
  ): Promise<ImagesResponseDataInner[] | undefined> {
    this.logger.info(Loggers.App, 'Attempting to hit OpenAi Image Api...');

    const flagged = await this.flagged(prompt);

    if (flagged) {
      console.log('Failed Moderation');
      throw 'Failed Moderation';
    } else {
      try {
        const size = ImageAspectRatios[aspect ?? 'Large'];
        const response = await this.openai.createImage({
          prompt: prompt,
          size,
          n: n ?? 1,
          response_format: 'b64_json',
        });

        /* Break the response into an array of strings for threading. */
        const content = response.data.data;
        return content;
      } catch (e) {
        console.log('Failed Image Gen');
        throw 'Failed Moderation';
      }
    }
  }
}
