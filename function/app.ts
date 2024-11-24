// External Modules
import Ajv from 'ajv/dist/jtd';

// Internal Modules
import { reportUriSchema } from './schema/report-uri';
import { responseSchema } from './schema/response';

// Types
import type { LambdaFunctionURLEvent, LambdaFunctionURLResult } from 'aws-lambda';
import type { ContentSecurityPolicyLevelThreeReportUri } from './schema/report';

// Constants
const ACCEPTABLE_CONTENT_TYPE = 'application/csp-report';

const ajv = new Ajv();
const serialize = ajv.compileSerializer(responseSchema);
const parse = ajv.compileParser<ContentSecurityPolicyLevelThreeReportUri>(reportUriSchema);

/**
 * A lambda handler that is being invoked directly through the lambda function url itself (not using API Gateway).
 * @param {Object} event - Lambda Function URL event
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
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
