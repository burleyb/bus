import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import leo from "leo-sdk";
import cron from "leo-sdk/wrappers/cron";

const ID = "leo_cron_monitor";
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

const botHandler = async (event, context) => {
  const loader = leo.load(ID, "monitor", { partitionHashKey: process.env.SHARD_HASH_KEY });
  const promises = event.Records.map(async (record) => {
    const now = record.dynamodb.ApproximateCreationDateTime * 1000;
    let newImage = { trigger: 0, invokeTime: 0 };
    let oldImage = { trigger: 0, invokeTime: 0 };

    if ("NewImage" in record.dynamodb) {
      newImage = unmarshall(record.dynamodb.NewImage);
    }
    if ("OldImage" in record.dynamodb) {
      oldImage = unmarshall(record.dynamodb.OldImage);
    }

    if (newImage.id === ID || newImage.ignoreMonitor === true) {
      return;
    }

    // Let's check if it started since last time
    if (newImage.instances) {
      for (const i of Object.keys(newImage.instances)) {
        const instance = newImage.instances[i];
        const oldInstance = oldImage.instances?.[i];
        if (instance.completedTime && (!oldInstance || oldInstance.completedTime === undefined)) {
          const start = oldInstance?.invokeTime || now;
          const end = instance.completedTime || now;
          await loader.write({
            id: newImage.id,
            type: 'completed',
            ts: end,
            start: start,
            is_error: instance.status === "error"
          });
        } else if (instance.invokeTime && (!oldInstance || oldInstance.invokeTime !== instance.invokeTime)) {
          const start = instance.invokeTime;
          await loader.write({
            id: newImage.id,
            type: 'started',
            start: start
          });
        }
      }
    }

    // Check for Checkpoint Read Events
    if (newImage.checkpoints?.read) {
      for (const event of Object.keys(newImage.checkpoints.read)) {
        const newCheckpoint = newImage.checkpoints.read[event];
        const oldCheckpoint = oldImage.checkpoints?.read?.[event]?.checkpoint;
        if (oldCheckpoint !== newCheckpoint.checkpoint && newCheckpoint.records !== undefined) {
          await loader.write({
            id: newImage.id,
            type: 'read',
            from: event,
            checkpoint: newCheckpoint.checkpoint,
            ts: newCheckpoint.ended_timestamp || now,
            units: newCheckpoint.records,
            start: newCheckpoint.started_timestamp || now,
            source_ts: newCheckpoint.source_timestamp || now
          });
        }
      }
    }

    // Check for Checkpoint Writes
    if (newImage.checkpoints?.write) {
      for (const event of Object.keys(newImage.checkpoints.write)) {
        const newCheckpoint = newImage.checkpoints.write[event];
        const oldCheckpoint = oldImage.checkpoints?.write?.[event]?.checkpoint;
        if (oldCheckpoint !== newCheckpoint.checkpoint && newCheckpoint.records !== undefined) {
          await loader.write({
            id: newImage.id,
            type: 'write',
            to: event,
            checkpoint: newCheckpoint.checkpoint,
            ts: newCheckpoint.ended_timestamp || now,
            units: newCheckpoint.records,
            start: newCheckpoint.started_timestamp || now,
            source_ts: newCheckpoint.source_timestamp || now
          });
        }
      }
    }
  });

  await Promise.all(promises);
  await loader.end();
};

export const handler = cron({}, botHandler);