import { Message, TextChannel } from 'discord.js';
import { AppLogger, Loggers } from '../resources/appLogger';
import dotenv from 'dotenv';
import { CustomStrings } from '../../constants/strings';

const logger = AppLogger.getInstance();

dotenv.config();

export const getChannelInfo = async (
  discordMessage: Message
): Promise<ChannelInfo> => {
  const channel = discordMessage.channel;

  logger.info(Loggers.App, CustomStrings.Divider);
  logger.info(Loggers.App, 'Looking For Channel Info...');
  let channelInfo: ChannelInfo = {
    Topic: '',
    ExtractedKeywords: {},
  };

  try {
    // Fetches the channel object from the Discord API to get its topic
    const fetchedChannel = await channel.fetch();
    if (fetchedChannel instanceof TextChannel) {
      const channelTopic = fetchedChannel.topic;

      if (channelTopic) {
        const keywords = ['Model', 'Mission', 'Objective'];
        const regex = new RegExp(
          `(${keywords.join('|')}):\\s*(.*?)\\s*(?=\\n[^\\n]*:|\\n*$)`,
          'g'
        );

        const matches: ExtractedKeywords = {};
        let match;
        while ((match = regex.exec(channelTopic)) !== null) {
          matches[match[1]] = match[2];
        }

        logger.info(Loggers.App, 'Found the following Channel Keywords.');
        logger.info(Loggers.App, matches);

        channelInfo = {
          Topic: channelTopic,
          ExtractedKeywords: matches,
        };
      }
    }
  } catch {
    logger.error(Loggers.App, `Failed to fetch Channel Information.`);
  }

  return channelInfo;
};

interface ExtractedKeywords {
  [key: string]: string | undefined;
}

export interface ChannelInfo {
  Topic: string;
  ExtractedKeywords: ExtractedKeywords;
}
