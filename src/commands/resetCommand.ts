import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "./interfaces/command";
import { reset } from "../constants/strings";

const resetCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Resets a conversation."),

  async execute(interaction: any) {
    await interaction.reply(reset);
  },
};
export default resetCommand;
