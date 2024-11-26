import 'dotenv/config';

// External Modules
/**
 * @see https://ajv.js.org/guide/getting-started.html
 */
import Ajv from 'ajv/dist/jtd';
/**
 * @see https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-cloudwatch
 */
import { CloudWatchClient, PutMetricDataCommand, type PutMetricDataCommandInput } from '@aws-sdk/client-cloudwatch';
/**
 * @see https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-cloudwatch-logs
 */
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  type PutLogEventsCommandInput,
} from '@aws-sdk/client-cloudwatch-logs';

// Internal Modules
import { reportUriSchema } from './schema/report-uri';
import { responseSchema } from './schema/response';
import { reportLogSchema } from './schema/report-log';

// Types
import type { LambdaFunctionURLEvent, LambdaFunctionURLResult } from 'aws-lambda';
import type { ContentSecurityPolicyLevelThreeReportUri } from './schema/report';

// Constants
const ACCEPTABLE_CONTENT_TYPE = 'application/csp-report';

const ajv = new Ajv();
const serialize = ajv.compileSerializer(responseSchema);
const parse = ajv.compileParser<ContentSecurityPolicyLevelThreeReportUri>(reportUriSchema);

const serializeLog = ajv.compileSerializer(reportLogSchema);

/**
 * A lambda handler that is being invoked directly through the lambda function url itself (not using API Gateway).
 * @param {Object} event - Lambda Function URL event
 * @returns {Object} object - Lambda Function URL result, follow the same schema as the Amazon API Gateway payload format version 2.0.
 * @see https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html#urls-payloads
 */
export const lambdaHandler = async (event: LambdaFunctionURLEvent): Promise<LambdaFunctionURLResult> => {
  try {
    /**
     * Ensure that the request method is POST only
     */
    if (event.requestContext.http.method !== 'POST') {
      return {
        statusCode: 405,
        body: serialize({
          message: 'Method Not Allowed',
          error: 'Method must be POST',
        }),
      };
    }

    /**
     * Ensure that the request headers have the correct content-type
     */
    if (!hasValidContentType(event.headers)) {
      return {
        statusCode: 400,
        body: serialize({
          message: 'Bad Request',
          error: `Content-Type must be ${ACCEPTABLE_CONTENT_TYPE}`,
        }),
      };
    }

    // Ensure that event.body is not undefined before parsing the body
    if (event.body === undefined)
      return {
        statusCode: 400,
        body: serialize({ message: 'Bad Request', error: 'event.body is undefined!' }),
      };

    let cspReport: string;
    if (event.isBase64Encoded) {
      cspReport = Buffer.from(event.body, 'base64').toString('utf8');
    } else {
      cspReport = event.body;
    }

    const parsedReport = parse(cspReport);
    if (parsedReport === undefined) {
      return {
        statusCode: 400,
        body: serialize({
          message: 'Bad Request',
          error: parse.message || 'invalid report-uri payload',
        }),
      };
    }

    // Send logs and metrics to CloudWatch
    await sendReportToCloudWatch(parsedReport, {
      userAgent: event.requestContext.http.userAgent,
      // Use the x-forwarded-for header if it exists, otherwise use the sourceIp
      clientIp: parseForwardedFor(event.headers) || event.requestContext.http.sourceIp,
    });

    return {
      statusCode: 200,
      body: serialize({
        message: 'Okay',
        error: null,
      }),
    };
  } catch (err) {
    console.error('An error had occurred!', err);
    if (err instanceof Error) {
      return {
        statusCode: 500,
        body: serialize({
          message: 'Internal Server Error',
          error: err.message,
        }),
      };
    }

    return {
      statusCode: 500,
      body: serialize({
        message: 'Internal Server Error',
        error: 'An unexpected error occurred. Please try again later.',
      }),
    };
  }
};

/**
 * Check if the headers have the correct content-type
 * @param {Object} headers - The headers object from the event
 * @returns {boolean} - true if the headers have the correct content-type, false otherwise
 */
function hasValidContentType(headers: Record<string, string | undefined>): boolean {
  const contentType = ['content-type', 'Content-Type', 'CONTENT-TYPE'];

  for (const key of contentType) {
    if (headers[key] === ACCEPTABLE_CONTENT_TYPE) {
      return true;
    }
  }

  return false;
}

/**
 * Parse the x-forwarded-for header from the headers
 * @param {Object} headers - The headers object from the event
 * @returns {string | undefined} - The client IP address or undefined if not found
 */
function parseForwardedFor(headers: Record<string, string | undefined>): string | undefined {
  const contentType = ['x-forwarded-for', 'X-Forwarded-For', 'X-FORWARDED-FOR'];

  for (const key of contentType) {
    if (headers[key]) {
      const ips = headers[key].split(',');
      // We only care about the client IP
      return ips[0].trim();
    }
  }
  return undefined;
}

/**
 * Send the CSP report to AWS cloudwatch logs and/or metrics
 * @param cspReport The stringify CSP report in string
 * @param parsedReport THe parsed CSP report in object
 * @returns void
 */
export async function sendReportToCloudWatch(
  parsedReport: ContentSecurityPolicyLevelThreeReportUri,
  { clientIp, userAgent }: { clientIp?: string; userAgent?: string } = { clientIp: undefined, userAgent: undefined },
): Promise<void> {
  // Uncomment for debugging
  // console.log(
  //   `REGION: ${process.env.REGION} \n
  //   LOG_GROUP_NAME: ${process.env.LOG_GROUP_NAME} \n
  //   LOG_STREAM_NAME: ${process.env.LOG_STREAM_NAME} \n
  //   METRIC_NAMESPACE: ${process.env.METRIC_NAMESPACE} \n
  //   METRIC_NAME: ${process.env.METRIC_NAME} \n`,
  // );

  const region = process.env.REGION;
  if (!region) return;

  const cloudwatch = new CloudWatchClient({ region: process.env.REGION });
  const cloudwatchLog = new CloudWatchLogsClient({ region: process.env.REGION });

  const timestamp = Date.now();

  const LOG_GROUP_NAME = process.env.LOG_GROUP_NAME;
  const LOG_STREAM_NAME = process.env.LOG_STREAM_NAME;

  const METRIC_NAMESPACE = process.env.METRIC_NAMESPACE;
  const METRIC_NAME = process.env.METRIC_NAME;

  // Prepare the log event
  let logEvent: PutLogEventsCommandInput | undefined = undefined;
  if (LOG_GROUP_NAME && LOG_STREAM_NAME) {
    logEvent = {
      logGroupName: LOG_GROUP_NAME,
      logStreamName: LOG_STREAM_NAME,
      logEvents: [
        {
          timestamp: timestamp,
          message: serializeLog({
            'csp-report': {
              ...parsedReport['csp-report'],
              clientIp,
              userAgent,
            },
          }),
        },
      ],
    };
  }

  // Prepare the metric data
  let metricData: PutMetricDataCommandInput | undefined = undefined;
  if (METRIC_NAMESPACE && METRIC_NAME) {
    metricData = {
      MetricData: [
        {
          MetricName: METRIC_NAME,
          Dimensions: [
            {
              Name: 'ViolatedDirective',
              Value: parsedReport['csp-report']['violated-directive'],
            },
            {
              Name: 'SourceFile',
              Value: parsedReport['csp-report']['source-file'] || 'none',
            },
            {
              Name: 'BlockedUri',
              Value: parsedReport['csp-report']['blocked-uri'],
            },
            {
              Name: 'DocumentUri',
              Value: parsedReport['csp-report']['document-uri'],
            },
          ],
          Value: 1,
          Timestamp: new Date(timestamp),
          Unit: 'Count',
        },
      ],
      Namespace: METRIC_NAMESPACE,
    };
  }

  // Send to CloudWatch
  if (logEvent && !metricData) {
    await cloudwatchLog.send(new PutLogEventsCommand(logEvent));
  }
  if (!logEvent && metricData) {
    await cloudwatch.send(new PutMetricDataCommand(metricData));
  }
  if (logEvent && metricData) {
    await Promise.all([
      cloudwatchLog.send(new PutLogEventsCommand(logEvent)),
      cloudwatch.send(new PutMetricDataCommand(metricData)),
    ]);
  }
  return;
}
