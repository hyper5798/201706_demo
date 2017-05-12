var express = require('express');
var router = express.Router();
var UnitDbTools = require('../models/unitDbTools.js');
var DeviceDbTools = require('../models/deviceDbTools.js');
var async = require('async');
var DeviceDbTools = require('../models/deviceDbTools.js');
var moment = require('moment');
var settings = require('../settings');
var verify_token = settings.verify_token;
var page_token = settings.page_token;

router.route('/')
	.get(function(req, res) {
		if (req.query['hub.verify_token'] === verify_token) {
			res.send(req.query['hub.challenge']);
		}
		res.send('Error, wrong validation token');
	})

	.post(function(req, res) {
		console.log('app.post : webhook');
		console.log(req.body);
		console.log('messaging_events.length:'+messaging_events.length);

		var data = req.body;

		// Make sure this is a page subscription
		if (data.object === 'page') {

			// Iterate over each entry - there may be multiple if batched
			data.entry.forEach(function(entry) {
				var pageID = entry.id;
				var timeOfEvent = entry.time;

				// Iterate over each messaging event
				entry.messaging.forEach(function(event) {
					if (event.message) {
						receivedMessage(event);
					} else {
						console.log("Webhook received unknown event: ", event);
					}
				});
			});

			// Assume all went well.
			//
			// You must send back a 200, within 20 seconds, to let us know
			// you've successfully received the callback. Otherwise, the request
			// will time out and we will keep trying to resend.
			res.sendStatus(200);
		}
	})
		
module.exports = router;

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}
/*function sendTextMessage(sender, text) {
  
  console.log('****sendTextMessage id:'+sender+', text :'+text);
  const messageData = {
    text: text
  }

  request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {
	        access_token:page_token
	    },
	    method: 'POST',
	    json: {
	      recipient: {
	        id: sender
	      },
	      message: messageData,
	    }
  }, function(error, response, body) {
	    if (error) {
	      console.log('Error sending message: ', error);
	    } else if (response.body.error) {
	      console.log('Error: ', response.body.error);
	    }
  });
}*/