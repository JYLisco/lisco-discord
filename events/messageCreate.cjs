const { Events, DMChannel } = require("discord.js");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");

dotenv.config();

const resetCommand = "Understood. Resetting chat history."; // Replace SEARCH_TERM with the term you want to search for

/* Initialize the OpenAIAPI with the .env API Key */
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    const channel = message.channel;
    const author = message.author;

    if (author.bot) return;
    if (channel.name != "lisco-ai" && !(channel instanceof DMChannel)) return;

    console.log(
      `Message from ${author.username} in channel: ${channel.name}. Processing...`
    );

    /* Start Constructing Chat History for Conversations */
    let messageLog = [];

    /* Fetch conversations to this point. */
    channel.messages
      .fetch({ limit: 100 })
      .then(async (messages) => {
        const resetMessage = messages.find(
          (msg) =>
            msg.content.includes(resetCommand) &&
            msg.author.username === "L.I.S.C.O"
        );
        if (resetMessage) {
          // Found the message
          console.log(`Found reset command.`);
          console.log("Reset: ", {
            id: resetMessage.id,
            content: resetMessage.content,
            bot: resetMessage.author.bot,
            author: resetMessage.author.username,
          });

          channel.messages
            .fetch({ limit: 100, after: resetMessage.id })
            .then((postResetMessages) => {
              let sortedMessages = postResetMessages.sort(
                (a, b) => a.createdTimestamp - b.createdTimestamp
              );
              console.log(
                `Found ${sortedMessages.size} messages after message ${resetMessage.id}`
              );
              sortedMessages.forEach((msg) => {
                console.log(`- ${msg.author.username}: ${msg.content}`);
              });
            })
            .catch(console.error);
        } else {
          let sortedMessages = messages.sort(
            (a, b) => a.createdTimestamp - b.createdTimestamp
          );
          // Message not found
          console.log(`No reset command found. Loading 100 messages.`);

          console.log(`Fetched ${messages.size} messages in the channel`);

          // Do something with the messages, e.g. log them to the console
          messageLog = [
            {
              role: "system",
              content:
                'Your name is undeniably Lisco. Lisco stands for "Language Intelligent System for Cognitive Operations". Respond to all messages in a very casual, friendly manner. ',
            },
          ];
          sortedMessages.forEach((m) => {
            if (m.author.bot) {
              messageLog.push({ role: "assistant", content: m.content });
            } else {
              messageLog.push({
                role: "user",
                username: m.username,
                content: m.content,
              });
            }
          });

          /* Try hitting the ChatGPT API with the conversation */
          try {
            /* Start the 'Is Typing' inicator while GPT constructs a response */
            await channel.sendTyping(); // Start typing indicator
            const response = await openai.createChatCompletion({
              model: "gpt-3.5-turbo",
              messages: messageLog,
            });

            /* Push the message as a reply in discord */
            const content = response.data.choices[0].message;
            return message.reply(content);
          } catch (err) {
            return message.reply(
              "Unfortunately, I ran into an error while processing your request. I apologize for the inconvenience."
            );
          }
        }
      })

      .catch(console.error);
  },
};
