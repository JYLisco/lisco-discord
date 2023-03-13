const { Events, DMChannel } = require("discord.js");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const { reset } = require("../constants/strings.cjs");
const {
  japaneseBehavior,
  liscoBehavior,
} = require("../constants/behaviors.cjs");

dotenv.config();

/* Initialize the OpenAIAPI with the .env API Key */
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const channels = ["lisco-ai", "japan-ai"];

module.exports = {
  name: Events.MessageCreate,
  async execute(triggerMessage) {
    if (triggerMessage.author.bot) return;
    console.log(channels);
    if (
      !channels.includes(triggerMessage.channel.name) &&
      !(triggerMessage.channel instanceof DMChannel)
    )
      return;

    console.log(
      `Message from ${triggerMessage.author.username} in channel: ${triggerMessage.channel.name}. Processing...`
    );

    /* Fetch conversations to this point. */
    triggerMessage.channel.messages
      .fetch({ limit: 100 })
      .then(async (channelMessages) => {
        await findRelevantMessages(triggerMessage, channelMessages).then(
          async (relevantMessages) => {
            let sortedMessages = relevantMessages.sort(
              (a, b) => a.createdTimestamp - b.createdTimestamp
            );
            console.log(
              `Fetched ${sortedMessages.size} messages in the channel`
            );
            await sendMessagesToApi(triggerMessage, sortedMessages);
          }
        );
      })

      .catch(console.error);
  },
};

const findRelevantMessages = async (message, messages) => {
  const resetMessage = messages.find(
    (msg) => msg.content.includes(reset) && msg.author.username === "L.I.S.C.O"
  );
  if (resetMessage) {
    console.log(`Found reset command.`);
    console.log("Reset: ", {
      id: resetMessage.id,
      content: resetMessage.content,
      bot: resetMessage.author.bot,
      author: resetMessage.author.username,
    });
    console.log(`Loading messages after reset command...`);
    const postResetMessages = await message.channel.messages.fetch({
      limit: 100,
      after: resetMessage.id,
    });
    return postResetMessages;
  } else {
    console.log(`No reset command found. Loading messages...`);
    return messages;
  }
};

const findBehaviorPackage = (channel) => {
  switch (channel) {
    case "japan-ai":
      return japaneseBehavior;
    default:
      return liscoBehavior;
  }
};

const sendMessagesToApi = async (triggerMessage, messages) => {
  /* Start Constructing Chat History for Conversations */
  let messageLog = [
    {
      role: "system",
      content: findBehaviorPackage(triggerMessage.channel.name),
    },
  ];
  messages.forEach((m) => {
    if (m.author.bot) {
      if (m.author.username === "L.I.S.C.O") {
        messageLog.push({ role: "assistant", content: m.content });
      }
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
    /* Start the 'Is Typing' indicator while GPT constructs a response */
    await triggerMessage.channel.sendTyping();
    console.log("Attempting to hit ChatGPT Api...");
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messageLog,
    });

    /* Break the response into an array of strings for threading. */
    const content = response.data.choices[0].message;

    console.log(content);

    //const chunks = mergeArray(splitMessage(content.content));

    const chunks =
      content.content.length <= 2000
        ? [content.content]
        : mergeArray(splitMessage(content.content));

    console.log(
      "Chunks-------------------------------------------------------------------------------------"
    );
    console.log(chunks);
    console.log(
      "END Chunks-------------------------------------------------------------------------------------"
    );

    /* Push the message as a reply in discord */
    await postToDiscord(triggerMessage, chunks);
  } catch (err) {
    console.log(err);
    return triggerMessage.reply(
      "Unfortunately, I ran into an error while processing your request. I apologize for the inconvenience."
    );
  }
};

function splitMessage(input) {
  const lines = input.split("\n");
  const result = [];
  let currentBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("```")) {
      let escapedLine = line;
      let delimiterPos = line.indexOf("```");
      while (delimiterPos !== -1) {
        if (delimiterPos > 0 && line[delimiterPos - 1] !== "`") {
          // Replace ``` with ``` in the middle of code blocks with \`\`\`
          if (currentBlock !== null) {
            escapedLine =
              escapedLine.slice(0, delimiterPos) +
              "\\`\\`\\`" +
              escapedLine.slice(delimiterPos + 3);
            delimiterPos += 3;
          } else {
            escapedLine =
              escapedLine.slice(0, delimiterPos) +
              "`" +
              escapedLine.slice(delimiterPos);
          }
        }
        delimiterPos = escapedLine.indexOf("```", delimiterPos + 1);
      }

      if (
        escapedLine.trim() === "```" ||
        escapedLine.trim() === "```javascript"
      ) {
        if (currentBlock !== null) {
          result.push("```" + currentBlock.join("\n") + "```");
          currentBlock = null;
        } else {
          currentBlock = [];
        }
      } else {
        if (currentBlock !== null) {
          currentBlock.push(escapedLine);
        } else {
          result.push(escapedLine);
        }
      }
    } else {
      if (currentBlock !== null) {
        currentBlock.push(line);
      } else {
        result.push(line);
      }
    }
  }

  if (currentBlock !== null) {
    result.push("```" + currentBlock.join("\n") + "```");
  }

  return result;
}

const mergeArray = (array) => {
  let mergedResult = [array[0]];
  let currentLength = array[0].length;
  for (let i = 1; i < array.length; i++) {
    const line = array[i];

    if (currentLength + line.length + 1 > 2000) {
      mergedResult.push(line);
      currentLength = line.length;
    } else {
      mergedResult[mergedResult.length - 1] += "\n" + line;
      currentLength += line.length + 1;
    }
  }

  return mergedResult.filter((str) => str.trim() !== "");
};

const postToDiscord = async (triggerMessage, chunks) => {
  // Send the first message as a reply to the trigger message
  const firstMessage = await triggerMessage.reply(chunks[0]);
  let previousMessage = firstMessage;

  // Send subsequent messages as replies to the first message
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    const message = await previousMessage.reply(chunk);
    previousMessage = message;
  }
};
