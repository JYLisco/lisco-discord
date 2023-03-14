import { SlashCommandBuilder } from "discord.js";
import { Command } from "./interfaces/command";

const serverCommand: Command = {
  data: new SlashCommandBuilder()
  .setName("server")
  .setDescription("Provides information about the server."),

  async execute(interaction: any) {
    await interaction.reply(
      `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`
    );  },
};
export default serverCommand;
