import { Message, TextChannel } from 'discord.js';
import { OpenAiConstants } from '../../constants/openai';
import { CustomStrings } from '../../constants/strings';
import { AppLogger, Loggers } from '../resources/appLogger';
import { formatDate } from '../strings/dateFormat';
import dotenv from 'dotenv';

dotenv.config();
const logger = AppLogger.getInstance();

export const getPostResetMessages = async (
  triggerMessage: Message
): Promise<Array<Message>> => {
  let result: Array<Message> = [];
  const channel = triggerMessage.channel as TextChannel;
  await channel.messages
    .fetch({ limit: OpenAiConstants.MAX_CONVERSATION_COUNT })
    .then(async (channelMessages: any) => {
      await findRelevantMessages(triggerMessage, channelMessages).then(
        async (relevantMessages) => {
          logger.info(Loggers.App, `${CustomStrings.Divider}`);
          let sortedMessages = relevantMessages.sort(
            (a: Message, b: Message) => a.createdTimestamp - b.createdTimestamp
          );
          logger.info(
            Loggers.App,
            `Fetched ${sortedMessages.size}/${OpenAiConstants.MAX_CONVERSATION_COUNT} max messages in the channel`
          );
          result = sortedMessages;
        }
      );
    })

    .catch(console.error);

  return result;
};

const findRelevantMessages = async (message: Message, messages: any) => {
  var channel = message.channel as TextChannel;

  const resetMessage = messages.find(
    (msg: Message) =>
      msg.content.includes(CustomStrings.Reset) &&
      msg.author.username === (process.env.BOT_NAME as string)
  );
  if (resetMessage) {
    var resetTime = formatDate(new Date(resetMessage.createdTimestamp));
    logger.info(Loggers.App, `Loading messages after reset at ${resetTime}...`);
    const postResetMessages = await channel.messages.fetch({
      limit: OpenAiConstants.MAX_CONVERSATION_COUNT,
      after: resetMessage.id,
    });
    return postResetMessages;
  } else {
    logger.info(Loggers.App, `No reset command found. Loading messages...`);
    let sortedMessages = messages.sort(
      (a: Message, b: Message) => a.createdTimestamp - b.createdTimestamp
    );
    return sortedMessages;
  }
};
