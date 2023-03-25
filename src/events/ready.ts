import { Events } from 'discord.js';
import { Behaviors } from '../constants/behaviors';
import { DiscordClient } from 'src/discordClient';
import { AppLogger, Loggers } from '../_util/resources/appLogger';

const logger = AppLogger.getInstance();

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client: DiscordClient) {
    logger.info(
      Loggers.App,
      `${Behaviors.Default.name} online. Logged in as ${client?.user?.tag}`
    );
  },
};
