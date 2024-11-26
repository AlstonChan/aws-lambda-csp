<h1 align="center">AWS NodeJs Lambda CSP</h1>
<p align="center">
  A <a href="https://aws.amazon.com/lambda/">AWS Lambda function</a> that act as an endpoint to receive <a href="https://www.w3.org/TR/CSP3/">Content Security Policy (CSP)</a> report, then send the violation report and metrics to <a href="https://aws.amazon.com/cloudwatch/"/>AWS CloudWatch</a> for centralized monitoring.
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJs">
  <img src="https://img.shields.io/badge/Lambda-ff9900?style=for-the-badge&logo=awslambda&logoColor=white" alt="Lambda">
  <img src="https://img.shields.io/badge/Amazon_AWS-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=white" alt="AWS">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="Typescript">
  <img src="https://img.shields.io/badge/Jest-323330?style=for-the-badge&logo=Jest&logoColor=white" alt="Jest">
  <br />
  <br />
</p>

## Overview

This Lambda function act as an endpoint to receive CSP violation reports. It will log the complete violation report, with some miscellaneous info such as client's user agent and generate metric for you. By default, the logs will retain for 180 days.

To use it in your CSP header, specify the endpoint in the `report-uri` directive as such:

```text
Content-Security-Policy-Report-Only: default-src 'self'; report-uri https://{ID}.lambda-url.{REGION}.on.aws;
```

> \[!WARNING]\
> The newest `report-to` directive is not supported and will most likely won't work. Even though `report-uri` has been deprecated, it has better browser support than `report-to` _([source](https://caniuse.com/?search=report-to))_.

### Project structure

This project contains source code and supporting files for a serverless application that you can deploy with the SAM CLI. It includes the following files and folders.

- `function` - Code for the application's Lambda function written in TypeScript.
- `function/tests` - Unit tests for the application code.
- `function/schema` - Schema to parse the CSP violation report and response object.
- `events` - Invocation events that you can use to invoke the function.
- `template.yaml` - A template that defines the application's AWS resources.

## Deploy the CSP lambda function

To use the SAM CLI to deploy the serverless application, you need the following tools.

- SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Node.js - [Install Node.js 22](https://nodejs.org/en/), including the NPM package management tool.
- Docker - [Install Docker community edition](https://docs.docker.com/engine/install/)

First clone the repository into your local machine:

```bash
git clone https://github.com/AlstonChan/aws-lambda-csp.git
```

To build and deploy your application for the first time, run the following in your shell:

```bash
cd function # Change directory into the function
npm install # Install the required dependency
cd .. # Return back to project root directory
sam build # Have SAM cli to build the application
sam deploy --guided # Deploy to AWS
```

> Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

- **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
- **AWS Region**: The AWS region you want to deploy your app to. You should check the [documentation](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html) on which region to use, because not all region supports lambda function URL.
- **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
- **Parameter**: Enter the parameter (env) for the project
  - **NodeEnv**: Always choose the default `production` by hitting enter. Default to _production_.
  - **LogGroupName**: This will be the log group name that will be used by the lambda function. Note that the csp violation report will be log at `${LogGroupName}/report` while the lambda function execution log itself will be stored at `${LogGroupName}/system`. Default to _/aws/lambda/ReceiveCSPReport_.
  - **LogStreamName**: The log Stream name under the log group. Default to _ReceiveCSPReport_.
  - **MetricNamespace**: This should be the project name. Default to _aws-lambda-csp_.
  - **MetricName**: The metric name to stored the violation metric. Default to _CSPViolation_.
  - **AllowOrigin**: The origin that are allowed to send csp violation report, should be the your website host.
- **Confirm changes before deploy**: If set to yes, a table of resource to be created/updated/deleted will be shown first before deploying the changeset.
- **Allow SAM CLI IAM role creation**: Many AWS SAM templates create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
- **ReceiveCSPReportFunction Function Url has no authentication. Is this okay?**: If set to no, the deploy will exit immediately. You should always enter yes as csp violation report endpoint should always be public facing and thus IAM authentication is not possible.
- **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

## Use the SAM CLI to build and test locally

Build your application with the `sam build` command.

```bash
aws-lambda-csp$ sam build
```

The SAM CLI installs dependencies defined in `function/package.json`, compiles TypeScript with esbuild, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test the function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
aws-lambda-csp$ sam local invoke ReceiveCSPReportFunction --event events/report-uri-base64.json
```

## Unit tests

Tests are defined in the `function/tests` folder in this project. Use NPM to install the [Jest test framework](https://jestjs.io/) and run unit tests.

```bash
aws-lambda-csp$ cd function
aws-lambda-csp$ npm install
aws-lambda-csp$ npm run test
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
sam delete --stack-name aws-lambda-csp
```

## Configure Custom Domain

The AWS console nor AWS SAM provide a direct way to configure custom domain for the function url. To use your own custom domain for the function url instead of the long and ugly function url, you would need to use two other AWS service, namely [Amazon CloudFront](https://aws.amazon.com/cloudfront/) and [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/). (You would probably use [Amazon Route 53](https://aws.amazon.com/route53/) if your setup your domain in AWS). We will be using a external DNS, Cloudflare to configure the custom domain.

1. Create a new CloudFront distribution
   - Origin Section
     - **Origin domain**: Directly paste your lambda function url, for example `1pf127k4cafvof25jm7qm1bz8bit7ri8.lambda-url.us-east-1.on.aws`. AWS will recognize that this is a lambda function url.
     - **Protocol**: Select `HTTPS only`
       - HTTPS port: Use the default port `443`
       - Minimum Origin SSL protocol: Use the default `TLSv1.2`
     - **Origin path** - optional: _Leave it empty_
     - **Name**: This should be automatically populated by AWS and have the same value as _Origin Domain_
   - Viewer Section
     - **Viewer protocol policy**: Select `Redirect HTTP to HTTPS`
     - Leave other setting as default, as AWS will set the recommended setting for you, like cache key with cache disabled
2. After a distribution is created, wait until the status is **Enabled**, and you should be able to access the function through the domain name of the CloudFront distribution.
3. Navigate to **AWS Certificate Manager** and _request a public certificate_.
   - **Fully qualified domain name**: This is the domain name of your lambda function url you wish to be
   - **Validation method**: Use the default `DNS validation`
   - **Key algorithm**: Use the default `RSA 2048`
   - You can now request the certificate and it will show you a table of **CNAME** record you need to enter into in your Cloudflare Dashboard.
4. Go to your Cloudflare dashboard, select the domain name you enter just now, navigate to DNS section and enter the CNAME record as shown by AWS.
5. You need to add another **CNAME** record that points the subdomain or your apex domain to the CloudFront distribution domain name too.
6. Wait until the AWS certificate manager has verified that the **CNAME** record exists (usually takes around 5 minutes for Cloudflare to propagate the DNS setting), you should then be able to access the lambda function using the custom domain you specify.

## Resources

- [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide)
- [MDN report-uri](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri)
- [W3C Content Security Policy Level 3 Specification](https://www.w3.org/TR/CSP3/)

## License

MIT License

Copyright (c) 2024 CHAN ALSTON

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
