"use strict";

import registerBot from './steps/register.js';
import s3LoadTrigger from './steps/s3-load-trigger.js';
import addCrons from './steps/add-crons.js';
import sendCustomResourceResponse from '../../lib/sendCustomResourceResponse.js';
import logger from 'leo-logger';

exports.handler = (event, _, callback) => {
	logger.log(JSON.stringify(event, null, 2));

	process.on('uncaughtException', function (err) {
		logger.error("Got unhandled Exception: ", err);
		sendCustomResourceResponse(event, 'FAILED', 'Uncaught Exception')
			.then(() => callback()).catch(callback);
	});

	// Handle 3rd party install requests
	let steps = [];
	const ignoreProperties = [ 'ServiceToken', 'Version' ];
	let keys = Object.keys(event.ResourceProperties || {}).filter(k => !ignoreProperties.includes(k));
	if (keys.length) {
		event.PhysicalResourceId = event.LogicalResourceId;
		keys.map(key => {
			let data = event.ResourceProperties[key];
			steps.push(registerBot(key, data));
		});
	} else {
		event.PhysicalResourceId = "install";
		steps.push(s3LoadTrigger());
		steps.push(addCrons());
	}

	Promise.all(steps).then(() => {
		logger.info("Got success");
		sendCustomResourceResponse(event, 'SUCCESS')
			.then((result) => callback()).catch(callback);
	}).catch((err) => {
		logger.error("Got error:", err);
		sendCustomResourceResponse(event, 'FAILED', 'It Failed!')
			.then((result) => callback()).catch(callback);
	});
};
