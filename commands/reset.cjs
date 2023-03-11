const { SlashCommandBuilder } = require("discord.js");
const { reset } = require("../constants/strings.cjs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("resets a conversation."),
  async execute(interaction) {
    await interaction.reply(reset);
  },
};
