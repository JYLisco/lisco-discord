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

    //console.log(content);

    const chunks = splitMessage(content.content);
    console.log(
      "Chunks-------------------------------------------------------------------------------------"
    );
    console.log(chunks);
    console.log(
      "END Chunks-------------------------------------------------------------------------------------"
    );
    // const chunks =
    //   content.content.length <= 2000
    //     ? [content.content]
    //     : splitMessage(content.content);

    /* Push the message as a reply in discord */
    await postToDiscord(triggerMessage, chunks);
  } catch (err) {
    console.log(err);
    return triggerMessage.reply(
      "Unfortunately, I ran into an error while processing your request. I apologize for the inconvenience."
    );
  }
};

// function splitMessage(response) {
//   console.log(`Attempting to process message of length ${response.length}...`);
//   const maxChunkLength = 1000; // Maximum length of each chunk
//   const chunks = [];

//   let inCodeBlock = false;
//   let codeBlockStart = 0;
//   let lastParagraphEnd = 0;
//   let lastSentenceEnd = 0;
//   let lastWordEnd = 0;

//   for (let i = 0; i < response.length; i++) {
//     if (response[i] === "`" && response.substring(i, i + 3) === "```") {
//       inCodeBlock = !inCodeBlock;
//     } else if (i - codeBlockStart >= maxChunkLength && !inCodeBlock) {
//       if (i - lastSentenceEnd >= maxChunkLength) {
//         // If we're in the middle of a sentence, finish the sentence
//         chunks.push(response.substring(codeBlockStart, lastSentenceEnd + 1));
//         codeBlockStart = lastSentenceEnd + 1;
//         lastParagraphEnd = lastSentenceEnd + 1;
//         lastWordEnd = lastSentenceEnd + 1;
//       } else if (i - lastWordEnd >= maxChunkLength) {
//         // If we're in the middle of a word, finish the word
//         chunks.push(response.substring(codeBlockStart, lastWordEnd));
//         codeBlockStart = lastWordEnd;
//         lastParagraphEnd = lastWordEnd;
//         lastSentenceEnd = lastWordEnd;
//       } else {
//         // Otherwise, finish the current paragraph
//         chunks.push(response.substring(codeBlockStart, lastParagraphEnd));
//         codeBlockStart = lastParagraphEnd;
//         lastSentenceEnd = lastParagraphEnd;
//         lastWordEnd = lastParagraphEnd;
//       }
//     } else {
//       if (response[i] === "." || response[i] === "?" || response[i] === "!") {
//         lastSentenceEnd = i;
//       }
//       if (response[i] === " ") {
//         lastWordEnd = i;
//       }
//       if (response[i] === "\n") {
//         lastParagraphEnd = i;
//         lastSentenceEnd = i;
//         lastWordEnd = i;
//       }
//     }
//   }

//   // Add the last chunk to the `chunks` array if it is not empty
//   const lastChunk = response.substring(codeBlockStart);
//   if (lastChunk.length > 0) {
//     chunks.push(lastChunk);
//   }

//   console.log(`Message split into ${chunks.length} chunks...`);
//   return chunks;
// }
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

  let mergedResult = [result[0]];
  let currentLength = result[0].length;
  for (let i = 1; i < result.length; i++) {
    const line = result[i];

    if (currentLength + line.length + 1 > 2000) {
      mergedResult.push(line);
      currentLength = line.length;
    } else {
      mergedResult[mergedResult.length - 1] += "\n" + line;
      currentLength += line.length + 1;
    }
  }

  return mergedResult.filter((str) => str.trim() !== "");
}

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
