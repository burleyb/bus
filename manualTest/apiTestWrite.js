/**
 * Reports that bot 'api-write-bot' is starting.
 * Creates and writes events to the queue 'api-queue-1'.
 * Reports that bot 'api-write-bot' is ending.
 */
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const apiHelper = require("./apiHelper");

const lambdaClient = new LambdaClient({ region: "us-west-2" });
const lambdaFunctionName = "Staging-LeoBusApiProcessor-12A1GKXVBLJXL";
const api = apiHelper(lambdaFunctionName, lambdaClient);

let id = "api-write-bot";
let writeQueue = "api-queue-1";

async function startBot() {
	try {
		const startData = await api.start(id, { lock: true });
		console.log("Start Data:", startData);

		const events = Array.from({ length: 10 }, (_, i) => ({
			data: i,
			now: Date.now(),
		}));

		const writeResponse = await api.write(id, writeQueue, events);
		console.log("Write Data:", writeResponse);

		const endData = await api.end(id, null, startData.token);
		console.log("End Data", endData);
	} catch (err) {
		console.error("Error:", err);
	}
}

startBot();
