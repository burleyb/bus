/**
 * Reports that bot 'api-test-bot-1' is starting.
 * Read Events from the queue 'api-queue-1' 2 at a time, transform the events, write the new events to the queue 'api-queue-2' and checkpoints after each group.
 * Reports that bot 'api-test-bot-1' is ending.
 */
const { LambdaClient } = require("@aws-sdk/client-lambda");
const lambda = new LambdaClient({ region: "us-east-1" });
const lambdaFunctionName = "Staging-LeoBusApiProcessor-12A1GKXVBLJXL";
const api = require("./apiHelper")(lambdaFunctionName, lambda);

const id = "api-test-bot-1";
const readQueue = "api-queue-1";
const writeQueue = "api-queue-2";

(async () => {
	try {
		const startData = await api.start(id, { lock: true });
		console.log("Start Data:", startData);

		let hasMore = true;

		while (hasMore) {
			try {
				// Read events
				const readResponse = await api.read(id, readQueue, { limit: 2 });
				console.log("Read Data:", readResponse);
				hasMore = readResponse.count > 0;

				if (!hasMore) break;

				// Transform events
				const events = readResponse.events.map(e => ({
					...e,
					payload: {
						...e.payload,
						api_write: Date.now(),
						api_data: Math.random() * 100000,
					},
				}));

				// Write transformed events to writeQueue
				const writeResponse = await api.write(id, writeQueue, events);
				console.log("Write Data:", writeResponse);

				// Checkpoint
				const checkpointResponse = await api.checkpoint(id, readQueue, readResponse.events[readResponse.events.length - 1].eid, {
					units: events.length,
				});
				console.log("Checkpoint Data:", checkpointResponse);
			} catch (innerErr) {
				console.error("Inner loop error:", innerErr);
				hasMore = false; // Stop loop on error
			}
		}

		// End processing
		const endData = await api.end(id, null, startData.token);
		console.log("End Data", endData);
	} catch (err) {
		console.error("Process Error:", err);
	}
})();
