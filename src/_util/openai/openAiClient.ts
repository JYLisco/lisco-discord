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

  async flagged(prompt: string): Promise<boolean> {
    this.logger.info(Loggers.App, `${CustomStrings.Divider}`);
    this.logger.info(
      Loggers.App,
      `Attempting to hit OpenAi Moderation Api with prompt...`
    );

    const response = await this.openai.createModeration({
      input: prompt,
    });

    /* Break the response into an array of strings for threading. */
    const flagged = response.data.results[0].flagged;

    if (flagged) {
      this.logger.error(Loggers.App, `Prompt violates moderation guidelines.`);
    } else {
      this.logger.info(
        Loggers.App,
        `Prompt does not violate moderation guidelines.`
      );
    }

    return flagged;
  }

  async image(
    prompt: string,
    n?: number,
    aspect?: 'Small' | 'Medium' | 'Large'
  ): Promise<ImagesResponseDataInner[] | undefined> {
    const flagged = await this.flagged(prompt);

    this.logger.info(Loggers.App, `${CustomStrings.Divider}`);

    if (flagged) {
      const error = 'Prompt flagged by moderation check.';
      throw error;
    } else {
      try {
        const size = ImageAspectRatios[aspect ?? 'Large'];

        this.logger.info(Loggers.App, 'Attempting to hit OpenAi Image Api...');

        const response = await this.openai.createImage({
          prompt: prompt,
          size,
          n: n ?? 1,
          response_format: 'b64_json',
        });

        /* Break the response into an array of strings for threading. */
        const content = response.data.data;

        if (content) {
          this.logger.info(
            Loggers.App,
            `Received a response from API. Processing...`
          );
        } else {
          this.logger.info(Loggers.App, `No Response from API.`);
        }

        return content;
      } catch (e) {
        const error = 'Error in image generation.';
        this.logger.error(Loggers.App, error);
        throw error;
      }
    }
  }

  async chat(
    messageLog: Array<ChatCompletionRequestMessage>,
    model?: 'gpt-4' | undefined
  ): Promise<ChatCompletionResponseMessage | undefined> {
    this.logger.info(Loggers.App, `${CustomStrings.Divider}`);

    var chatModel = model ?? 'gpt-3.5-turbo';
    this.logger.info(
      Loggers.App,
      `Attempting to hit ChatGPT Api - Model: ${chatModel}...`
    );
    const response = await this.openai.createChatCompletion({
      model: chatModel,
      messages: messageLog,
    });

    /* Break the response into an array of strings for threading. */
    const content = response.data.choices[0].message;

    if (content) {
      this.logger.info(
        Loggers.App,
        `Received a response from API. Processing...`
      );
      this.logger.info(Loggers.Api, content?.content);
    } else {
      this.logger.info(Loggers.App, `No Response from API.`);
    }

    return content;
  }
}
