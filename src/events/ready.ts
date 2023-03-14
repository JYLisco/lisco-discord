
import { Events } from "discord.js";
import { DiscordClient } from "src/interfaces/discordClient";

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client: DiscordClient) {
    console.log(`L.I.S.C.O online. Logged in as ${client?.user?.tag}`);
  },
};
