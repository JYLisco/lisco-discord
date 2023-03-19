import { Message, TextChannel } from 'discord.js';
import { CustomStrings } from '../../constants/strings';
import { AppLogger, Loggers } from '../resources/appLogger';

const logger = AppLogger.getInstance();

export const generateSystemMessage = async (
  discordMessage: Message
): Promise<string> => {
  let systemMessage: string = CustomStrings['Identity'];
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
