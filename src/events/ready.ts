import { Events } from 'discord.js';
import { DiscordClient } from 'src/discordClient';
import { AppLogger, Loggers } from '../_util/resources/appLogger';

const logger = AppLogger.getInstance();

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client: DiscordClient) {
    logger.info(
      Loggers.App,
      `L.I.S.C.O online. Logged in as ${client?.user?.tag}`
    );
  },
};
