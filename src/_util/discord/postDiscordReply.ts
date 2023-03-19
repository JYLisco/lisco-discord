import { Message } from 'discord.js';
import { CustomStrings } from '../../constants/strings';
import { AppLogger, Loggers } from '../resources/appLogger';
import { processTextForDiscord } from './processDiscordMessage';

const logger = AppLogger.getInstance();

export const postDiscordReply = async (
  triggerMessage: Message,
  reply: string
) => {
  const replies = processTextForDiscord(reply);

  logger.info(Loggers.Api, `Message Replies${CustomStrings.Divider}`);
  logger.info(Loggers.Api, replies);
  logger.info(Loggers.Api, `END Message Replies${CustomStrings.Divider}`);

  // Send the first message as a reply to the trigger message
  const firstMessage = await triggerMessage.reply(replies[0]);
  let previousMessage = firstMessage;

  // Send subsequent messages as replies to the first message
  for (let i = 1; i < replies.length; i++) {
    const chunk = replies[i];
    const message = await previousMessage.reply(chunk);
    previousMessage = message;
  }
};
