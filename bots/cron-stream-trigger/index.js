import { DynamoDBClient, UpdateCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import leo from "leo-sdk";
import moment from "moment";
import refUtil from "leo-sdk/lib/reference.js";

const dynamodb = leo.aws.dynamodb;
const configuration = leo.configuration;

const CRON_TABLE = configuration.resources.LeoCron;
const MAX_CACHE_MILLISECONDS = 1000 * 10;
let lastCacheTime = 0;
let cache = null;

const dynamoClient = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event, context) => {
  try {
    const cronTable = await getCronTable();
    const idsToTrigger = await getIdsToTrigger(cronTable, event.Records);
    const result = await setTriggers(idsToTrigger);
    console.log(`Triggered at time: ${result.time} for ids: ${JSON.stringify(result.data)}`);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

async function setTriggers(results) {
  const now = moment.now();

  try {
    await Promise.all(results.map(async (data) => {
      console.log(`Setting Cron trigger for ${data.id}, ${now}`);

      const sets = ["#trigger = :trigger"];
      const ean = {
        "#requested_kinesis": "requested_kinesis",
        "#trigger": "trigger"
      };
      const eav = {
        ":trigger": moment.now()
      };

      Object.keys(data.events).forEach((key, i) => {
        const index = i + 1;
        const event = data.events[key];
        sets.push(`#requested_kinesis.#n_${index} = :v_${index}`);
        ean[`#n_${index}`] = key;
        eav[`:v_${index}`] = event;
      });

      const command = new UpdateCommand({
        TableName: CRON_TABLE,
        Key: { id: data.id },
        UpdateExpression: 'set ' + sets.join(", "),
        ExpressionAttributeNames: ean,
        ExpressionAttributeValues: eav,
        ReturnConsumedCapacity: 'TOTAL'
      });

      await dynamoClient.send(command);
    }));

    return { data: results, time: now };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getIdsToTrigger(cronTable, records) {
  const idsToTrigger = {};

  records.forEach(record => {
    if ("NewImage" in record.dynamodb) {
      const newImage = DynamoDBClient.Converter.unmarshall(record.dynamodb.NewImage);
      const oldImage = record.dynamodb.OldImage && DynamoDBClient.Converter.unmarshall(record.dynamodb.OldImage);
      const event = refUtil.refId(newImage.event);
      const newMax = max(newImage.kinesis_number, newImage.s3_kinesis_number, newImage.initial_kinesis_number, newImage.s3_new_kinesis_number, newImage.eid, newImage.max_eid);
      const oldMax = oldImage && max(oldImage.kinesis_number, oldImage.s3_kinesis_number, oldImage.initial_kinesis_number, oldImage.s3_new_kinesis_number, oldImage.eid, oldImage.max_eid);
      if (newMax != oldMax && event in cronTable) {
        cronTable[event].forEach(id => {
          idsToTrigger[id] = idsToTrigger[id] || { id: id, events: {} };
          idsToTrigger[id].events[event] = newMax;
        });
      }
    }
  });

  return idsToTrigger;
}

function max() {
  let maxValue = arguments[0];
  for (let i = 1; i < arguments.length; ++i) {
    if (arguments[i] != null && arguments[i] != undefined) {
      maxValue = maxValue > arguments[i] ? maxValue : arguments[i];
    }
  }
  return maxValue;
}

async function getCronTable() {
  const now = moment.now();
  if (!cache || lastCacheTime + MAX_CACHE_MILLISECONDS <= now) {
    console.log("Looking up the Current Cron Table", now - lastCacheTime, MAX_CACHE_MILLISECONDS);
    cache = {};
    try {
      const params = { TableName: CRON_TABLE };
      const data = await dynamoClient.send(new ScanCommand(params));

      data.Items.forEach(item => {
        if (!item.archived && item.triggers) {
          const triggers = item.triggers;

          triggers.forEach(trigger => {
            trigger = refUtil.refId(trigger);
            if (!(trigger in cache)) {
              cache[trigger] = [];
            }
            cache[trigger].push(item.id);
          });
        }
      });

      lastCacheTime = moment.now();
      return cache;
    } catch (err) {
      console.error(err);
      throw new Error("Unable to get Cron Table");
    }
  } else {
    console.log("Getting Cron Table from cache");
    return cache;
  }
}
