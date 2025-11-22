const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createWriteStream } = require("fs");

module.exports.config = {
  name: "say",
  version: "1.0.0",
  hasPermission: 0,
  credits: "KOJA-PROJECT",
  commandCategory: "group",
  description: "text to voice speech messages",
  usages: "say [text]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  try {
    const content = (event.type === "message_reply") 
      ? event.messageReply.body 
      : args.join(" ");

    if (!content) return api.sendMessage("❗ Please provide text to speak.", event.threadID, event.messageID);

    const languageToSay = "en"; // default to English
    const msg = content;
    const filePath = path.resolve(__dirname, 'cache', `${event.threadID}_${event.senderID}.mp3`);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=${languageToSay}&client=tw-ob`;

    // Download file
    const response = await axios({
      method: "GET",
      url: ttsUrl,
      responseType: "stream"
    });

    const writer = createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    });

    writer.on("error", (err) => {
      console.error(err);
      api.sendMessage("❌ Failed to process voice message.", event.threadID, event.messageID);
    });
  } catch (e) {
    console.error("Say command error:", e);
    return api.sendMessage("❌ Error converting text to speech.", event.threadID, event.messageID);
  }
};
