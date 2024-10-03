import https from "https";
import logger from 'leo-logger';

function sendCustomResourceResponse(event, status, reason) {
    const result = {
        Status: status,
        Reason: reason,
        PhysicalResourceId: event.PhysicalResourceId,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId
    };
    logger.info(result);
    
    const responseBody = JSON.stringify(result);
    const parsedUrl = new URL(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };
  
    return new Promise((resolve, reject) => {
        const request = https.request(options, function (response) {
            logger.info("Status code: " + response.statusCode);
            logger.info("Status message: " + response.statusMessage);
            resolve(response);
        });
  
        request.on("error", function (error) {
            logger.error("send(..) failed executing https.request(..): " + error);
            reject(error);
        });
        request.write(responseBody);
        request.end();
    });
}

export default sendCustomResourceResponse;
