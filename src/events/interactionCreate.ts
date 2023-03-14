import { Interaction } from "discord.js";
import { Command } from "src/commands/interfaces/command";
import { DiscordClient } from "src/interfaces/discordClient";

module.exports = {
  name: "interactionCreate",
  async execute(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const client = interaction.client as DiscordClient;
    const command = client.commands.get(interaction.commandName) as Command;

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
    }
  },
};
