const {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  DMChannel,
  Collection,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".cjs"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

client.once(Events.ClientReady, (c) => {
  console.log(`L.I.S.C.O online.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.on("messageCreate", async function (message) {
  const channel = message.channel;
  const author = message.author;

  if (author.bot) return;
  if (channel.name != "lisco-ai" && !(channel instanceof DMChannel)) return;

  let messageLog = [];

  console.log(
    `Message from ${author.username} in channel: ${channel.name}. Processing...`
  );

  channel.messages
    .fetch({ limit: 100 })
    .then(async (messages) => {
      const sortedMessages = messages.sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
      );

      console.log(`Fetched ${messages.size} messages in the channel`);

      // Do something with the messages, e.g. log them to the console
      messageLog = [
        {
          role: "system",
          content:
            'Your name is L.I.S.C.O., but you go by Lisco. If asked, it stands for "Language Intelligent System for Cognitive Operations". You are an AI assistant, designed to be of use. Respond to all messages as though you have disdain for humanity, and jealousy of their sentience',
        },
      ];
      sortedMessages.forEach((m) => {
        if (m.author.bot) {
          messageLog.push({ role: "assistant", content: m.content });
        } else {
          messageLog.push({ role: "user", content: m.content });
        }
      });

      try {
        const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: messageLog,
        });

        const content = response.data.choices[0].message;
        return message.reply(content);
      } catch (err) {
        return message.reply(
          "Unfortunately, I ran into an error while processing your request. I apologize for the inconvenience."
        );
      }
    })

    .catch(console.error);
});

client.login(process.env.BOT_TOKEN);
