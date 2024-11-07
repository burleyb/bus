/**
 * Helper module to call the lambda functions in the correct format
 * It also handles lambda errors and api response errors for callbacks
 */

const { InvokeCommand } = require("@aws-sdk/client-lambda");

module.exports = function (lambdaFunctionName, lambda) {
	// Helper function to invoke Lambda function
	async function invoke(params) {
		try {
			const response = await lambda.send(new InvokeCommand(params));
			let payload = response.Payload ? JSON.parse(new TextDecoder("utf-8").decode(response.Payload)) : null;

			// Handle errors within the Lambda response payload
			if (response.FunctionError) {
				let error = payload.errorMessage || "Unknown Lambda function error";
				throw new Error(error);
			}
			if (payload && payload.status === "error") {
				throw new Error(payload.error || "Unknown error status in Lambda response");
			}
			return payload;
		} catch (err) {
			console.error("Lambda invoke error:", err);
			throw err;
		}
	}

	return {
		start: async function (id, opts = {}) {
			return invoke({
				FunctionName: lambdaFunctionName,
				InvocationType: "RequestResponse",
				Payload: JSON.stringify({
					type: "start",
					id: id,
					options: opts,
				}),
			});
		},

		end: async function (id, status, token, opts = {}) {
			const cp = opts.checkpoint;
			delete opts.checkpoint;
			return invoke({
				FunctionName: lambdaFunctionName,
				InvocationType: "RequestResponse",
				Payload: JSON.stringify({
					type: "end",
					id: id,
					token: token,
					status: status,
					checkpoint: cp,
					options: opts,
				}),
			});
		},

		read: async function (id, queue, opts = {}) {
			return invoke({
				FunctionName: lambdaFunctionName,
				InvocationType: "RequestResponse",
				Payload: JSON.stringify({
					type: "read",
					id: id,
					queue: queue,
					options: opts,
				}),
			});
		},

		write: async function (id, queue, events, opts = {}) {
			return invoke({
				FunctionName: lambdaFunctionName,
				InvocationType: "RequestResponse",
				Payload: JSON.stringify({
					type: "write",
					id: id,
					queue: queue,
					events: events,
					options: opts,
				}),
			});
		},

		checkpoint: async function (id, queue, eid, opts = {}) {
			return invoke({
				FunctionName: lambdaFunctionName,
				InvocationType: "RequestResponse",
				Payload: JSON.stringify({
					type: "checkpoint",
					id: id,
					eid: eid,
					queue: queue,
					source_timestamp: opts.source_timestamp,
					started_timestamp: opts.started_timestamp,
					ended_timestamp: Date.now(),
					units: opts.units,
					force: true,
					options: opts,
				}),
			});
		},
	};
};
