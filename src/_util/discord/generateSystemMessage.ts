import { Message, TextChannel } from 'discord.js';
import { AppLogger, Loggers } from '../resources/appLogger';
import dotenv from 'dotenv';

const logger = AppLogger.getInstance();

dotenv.config();

export const generateSystemMessage = async (
  discordMessage: Message
): Promise<string> => {
  let systemMessage: string = ((('Your Name Is ' +
    process.env.BOT_NAME) as string) + process.env.BOT_DESC) as string;
  const channel = discordMessage.channel;

  try {
    // Fetches the channel object from the Discord API to get its topic
    const fetchedChannel = await channel.fetch();
    if (fetchedChannel instanceof TextChannel) {
      const channelTopic = fetchedChannel.topic;

      if (channelTopic && channelTopic.includes('Mission:')) {
        const mission = channelTopic.split('Mission:')[1].trim();
        systemMessage += ` Your mission: ${mission}`;
      }
    }
  } catch {
    logger.error(
      Loggers.App,
      `Failed to fetch system Message. Reverting to default.`
    );
  }
  return systemMessage;
};
