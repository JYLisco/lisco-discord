import { Events } from 'discord.js';
import { DiscordClient } from 'src/interfaces/discordClient';
import { AppLogger } from '../_util/appLogger';

const logger = AppLogger.getInstance();

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client: DiscordClient) {
    logger.info(`L.I.S.C.O online. Logged in as ${client?.user?.tag}`);
  },
};
