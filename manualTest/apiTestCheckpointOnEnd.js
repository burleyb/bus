/**
 * Reports the bot is starting.
 * Read Events from the queue 'api-queue-2' 3 at a time, transform the events, write the new events to the queue 'api-queue-3'.
 * Checkpoints the last event eid at the very end.
 * Reports the bot is ending.
 */
const { LambdaClient } = require("@aws-sdk/client-lambda");
const lambda = new LambdaClient({ region: "us-east-1" });
const lambdaFunctionName = "Staging-LeoBusApiProcessor-12A1GKXVBLJXL";
const api = require("./apiHelper")(lambdaFunctionName, lambda);

const id = "api-test-bot-2";
const readQueue = "api-queue-2";
const writeQueue = "api-queue-3";

(async () => {
	try {
		const startData = await api.start(id, { lock: true });
		console.log("Start Data:", startData);

		let hasMore = true;
		let lastEid;
		let units = 0;

		while (hasMore) {
			try {
				// Read events from readQueue with a limit of 3
				const readResponse = await api.read(id, readQueue, { limit: 3, start: lastEid });
				console.log("Read Data:", readResponse);
				hasMore = readResponse.count > 0;

				if (!hasMore) break;

				// Transform events
				const events = readResponse.events.map(e => {
					e.payload.api_write = Date.now();
					e.payload.api_data = Math.random() * 100000;
					lastEid = e.eid;
					units++;
					return e;
				});

				// Write transformed events to writeQueue
				const writeResponse = await api.write(id, writeQueue, events);
				console.log("Write Data:", writeResponse);
			} catch (innerErr) {
				console.error("Inner loop error:", innerErr);
				hasMore = false; // Stop loop on error
			}
		}

		// Checkpoint at the end
		let checkpoint = { queue: readQueue, eid: lastEid, units };
		const endData = await api.end(id, null, startData.token, { checkpoint });
		console.log("End Data", endData);
	} catch (err) {
		console.error("Process Error:", err);
	}
})();
