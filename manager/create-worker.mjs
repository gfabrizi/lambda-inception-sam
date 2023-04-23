import {
    Architecture,
    CreateFunctionCommand,
    LambdaClient,
    PackageType,
} from "@aws-sdk/client-lambda";

const {randomUUID} = await import('crypto');
import fs from 'fs';

function createWorker(awsRegion, lambdaInceptionWorkerRole) {
    const lambda = new LambdaClient({region: awsRegion, apiVersion: '2015-03-31'});
    const functionName = 'worker-' + randomUUID();

    const functionCommand = new CreateFunctionCommand({
        Code: {
            ZipFile: fs.readFileSync('worker.zip')
        },
        Architectures: [Architecture.x86_64],
        FunctionName: functionName,
        Handler: 'worker.handler',
        PackageType: PackageType.Zip,
        Role: lambdaInceptionWorkerRole,
        Runtime: 'nodejs18.x',
        Description: 'Crawler Worker ' + functionName
    });

    return lambda.send(functionCommand);
}

export {createWorker};