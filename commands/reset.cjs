const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("resets a conversation."),
  async execute(interaction) {
    await interaction.reply("Understood. Resetting chat history.");
  },
};
