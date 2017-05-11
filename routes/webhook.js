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

		const messaging_events = req.body.entry[0].messaging;
		for (let i = 0; i < messaging_events.length; i++) {
			const event = req.body.entry[0].messaging[i];
			const sender = event.sender.id;
			
			if (event.message && event.message.text) {
				console.log('event.message.text:'+event.message.text);
				console.log('sender:'+event.sender.id);
				const text = event.message.text;
				sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));
			}
		}
		res.sendStatus(200);
	})
		
module.exports = router;

function sendTextMessage(sender, text) {
  
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
}