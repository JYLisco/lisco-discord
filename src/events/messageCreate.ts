import { Events, DMChannel, TextChannel, Message } from 'discord.js';
import dotenv from 'dotenv';
import { ChatCompletionRequestMessage } from 'openai';
import { CustomStrings } from '../constants/strings';
import { AppLogger, Loggers } from '../_util/resources/appLogger';
import { trimMessageLog } from '../_util/openai/gpt/trimMessageLog';
import { postDiscordReply } from '../_util/discord/postDiscordReply';
import { OpenAiClient } from '../_util/openai/openAiClient';
import { generateSystemMessage } from '../_util/discord/generateSystemMessage';
import {
  GptModels,
  getModelFromString,
  getTokenCountFromGptModel,
} from '../constants/openai';
import { getPostResetMessages } from '../_util/discord/getPostResetMessages';
import { ChannelInfo, getChannelInfo } from '../_util/discord/getChannelInfo';

dotenv.config();

const logger = AppLogger.getInstance();
const openai = OpenAiClient.getInstance();

module.exports = {
  name: Events.MessageCreate,
  async execute(triggerMessage: any) {
    if (triggerMessage.author.bot) return;

    logger.info(Loggers.App, `${CustomStrings.Divider}`);

    /* Respond in "-ai" channels and in DM's */
    if (
      triggerMessage.channel instanceof TextChannel &&
      !triggerMessage.channel.name.endsWith('-ai') &&
      !(triggerMessage.channel instanceof DMChannel)
    ) {
      return;
    }

    var channel = triggerMessage.channel as TextChannel;

    logger.info(
      Loggers.App,
      `Message from ${triggerMessage.author.username} in channel: ${channel.name}. Processing...`
    );

    const channelInfo = await getChannelInfo(triggerMessage);

    try {
      const messages = await getPostResetMessages(triggerMessage);
      await sendMessagesToApi(triggerMessage, channelInfo, messages);
    } catch (err) {
      logger.error(Loggers.App, err);
    }
  },
};

const sendMessagesToApi = async (
  triggerMessage: Message,
  channelInfo: ChannelInfo,
  messages: Array<Message>
) => {
  var channel = triggerMessage.channel as TextChannel;

  /* Start Constructing Chat History for Conversations */
  let messageLog: Array<ChatCompletionRequestMessage> = [
    {
      role: 'system',
      content: await generateSystemMessage(
        channelInfo.ExtractedKeywords['Mission']
      ),
    },
  ];
  messages.forEach(
    (m: { author: { bot: any; username: string }; content: any }) => {
      if (m.author.bot) {
        if (m.author.username === (process.env.BOT_NAME as string)) {
          messageLog.push({ role: 'assistant', content: m.content });
        }
      } else {
        messageLog.push({
          role: 'user',
          content: m.content,
        });
      }
    }
  );

  const model: string | undefined = channelInfo.ExtractedKeywords['Model'];
  const gptModel = model ? getModelFromString(model) : GptModels.Gpt3_5_Turbo;

  const tokenCount = getTokenCountFromGptModel(gptModel);
  messageLog = trimMessageLog(messageLog, tokenCount);
  logger.info(
    Loggers.App,
    `Trimmed to ${messageLog.length - 1} messages for Max ${tokenCount} tokens.`
  );
  /* Try hitting the ChatGPT API with the conversation */
  try {
    /* Start the 'Is Typing' indicator while GPT constructs a response */
    await channel.sendTyping();

    let response;

    if (gptModel !== null) {
      response = await openai.chat(messageLog, gptModel);
    } else {
      response = await openai.chat(messageLog);
    }

    if (response) {
      await postDiscordReply(triggerMessage, response.content);
    } else {
      throw 'No API Response';
    }
  } catch (err) {
    logger.error(Loggers.App, err);
    return triggerMessage.reply(CustomStrings.ErrorMessage);
  }
};
