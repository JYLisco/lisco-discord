import { GatewayIntentBits, Partials, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { DiscordClient } from './discordClient';

/* Retrieve environment variables */
dotenv.config();

/* Initialize Client */
const client = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
}); // specify the Client type parameter

client.commands = new Collection<string, any>();

/* Load Commands and Event handling */
client.loadCommands();
client.loadEvents();

/* Login to Discord */
client.login(process.env.BOT_TOKEN);
