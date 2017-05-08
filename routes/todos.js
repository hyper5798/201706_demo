var express = require('express');
var router = express.Router();
var UnitDbTools = require('../models/unitDbTools.js');
var DeviceDbTools = require('../models/deviceDbTools.js');
var async = require('async');
var DeviceDbTools = require('../models/deviceDbTools.js');
var moment = require('moment');

router.route('/devices')

	// create a bear (accessed at POST http://localhost:8080/bears)
	/*.post(function(req, res) {

		var bear = new Bear();		// create a new instance of the Bear model
		bear.name = req.body.name;  // set the bears name (comes from the request)

		bear.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Bear created!' });
		});

	})*/

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		var mac    = req.query.mac;
		var option = req.query.option;
		var mdate  = req.query.mdate;
		DeviceDbTools.findDevicesByDate(mdate,mac,Number(option),'asc',function(err,devices){
		    if (err)
				return res.send(err);
			return res.json(devices);
		});
	});

router.route('/devices/:mac')

	// get the bear with that id
	.get(function(req, res) {
		DeviceDbTools.findByMac(req.params.mac, function(err, devices) {
			if (err)
				return res.send(err);
			return res.json(devices);
		});
	})

	// update the bear with this id
	.put(function(req, res) {
		Bear.findById(req.params.bear_id, function(err, bear) {

			if (err)
				res.send(err);

			bear.name = req.body.name;
			bear.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Bear updated!' });
			});

		});
	})

	// delete the bear with this id
	.delete(function(req, res) {
		Bear.remove({
			_id: req.params.bear_id
		}, function(err, bear) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	});

module.exports = router;