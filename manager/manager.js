import {app as APP} from "./app.mjs"
import {res} from "./res.mjs";

import { InvokeCommand, DeleteFunctionCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";

import {createWorker} from "./create-worker.mjs";

let app = APP(res);

const awsRegion = process.env.AWS_REGION;
const lambdaInceptionWorkerRole = process.env.LAMBDA_INCEPTION_WORKER_ROLE;


// Crawl
app.post('/crawl', async (req, res) => {
    if (!req.body.url || (req.body.url.length === 0)) {
        res.json('You must specify an url to crawl!', 500);
        return;
    }

    try {
        const worker = await createWorker(awsRegion, lambdaInceptionWorkerRole);

        const lambdaClient = new LambdaClient({region: awsRegion, apiVersion: '2015-03-31'});
        const invokeCommand = new InvokeCommand({
            FunctionName: worker.FunctionName,
            Payload: JSON.stringify({
                'url': req.body.url,
                'accept': req.body.accept ?? 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'contentType': req.body.contentType ?? 'application/octet-stream',
                'method': req.body.method ?? 'GET',
            }),
            LogType: LogType.Tail,
        });

        const { Payload, LogResult } = await lambdaClient.send(invokeCommand);
        const result = Buffer.from(Payload).toString();

        const deleteCommand = new DeleteFunctionCommand({
            FunctionName: worker.FunctionName
        });
        await lambdaClient.send(deleteCommand);

        res.json(result, 200);

    } catch (e) {
        console.log(e);
        // res.json(JSON.stringify(e), 500); // for debug purposes
        res.json("Error while creating Lambda function", 500);
    }
});

let handler = async (event, context) => {
    res.reset();

    await app.handle(event);

    return res.getResponse();
};

export {handler};