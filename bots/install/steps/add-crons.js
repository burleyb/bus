"use strict";
import leo from "leo-sdk";

export default  function() {
	let resources = leo.configuration.resources;
	let monitorConfig = require("../../leo-monitor/package.json").config.leo.cron;
	return Promise.all([
		leo.bot.createBot("leo_cron_monitor", monitorConfig),
		leo.bot.createBot(resources.LeoFirehoseStreamProcessor, require("../../firehose_processor/package.json").config.leo.cron)
	]);
};
