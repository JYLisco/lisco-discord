const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`L.I.S.C.O online. Logged in as ${client.user.tag}`);
  },
};
