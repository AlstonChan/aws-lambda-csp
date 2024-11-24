// External Modules
import { expect, describe, it, beforeEach } from '@jest/globals';

// Test target
import { lambdaHandler } from '../../app';

// Events
import eventJson from '../../../events/report-uri-json.json';
import eventBase64 from '../../../events/report-uri-base64.json';

// Types
import type { LambdaFunctionURLEvent } from 'aws-lambda';

describe('Unit test for app handler', () => {
  let baseEvent: LambdaFunctionURLEvent;

  beforeEach(() => {
    baseEvent = {
      version: '2.0',
      routeKey: '$default',
      rawPath: '/',
      rawQueryString: '',
      cookies: [],
      headers: {
        'sec-fetch-mode': 'no-cors',
        'content-length': '1001',
        'x-amzn-tls-version': 'TLSv1.3',
        'sec-fetch-site': 'cross-site',
        'x-forwarded-proto': 'https',
        'accept-language': 'en-US,en;q=0.5',
        origin: 'https://www.example.com',
        'x-forwarded-port': '443',
        dnt: '1',
        'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        priority: 'u=4',
        pragma: 'no-cache',
        accept: '*/*',
        'x-amzn-tls-cipher-suite': 'TLS_AES_128_GCM_SHA256',
        'sec-gpc': '1',
        'x-amzn-trace-id': 'Root=1-6742b56a-2244e3ed22501dbe56fabe2b',
        host: '1pf127k4cafvof25jm7qm1bz8bit7ri8.lambda-url.us-east-1.on.aws',
        'content-type': 'application/csp-report',
        'cache-control': 'no-cache',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'user-agent':
          'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_10_2; en-US) AppleWebKit/536.2 (KHTML, like Gecko) Chrome/47.0.2772.124 Safari/537',
        'sec-fetch-dest': 'report',
      },
      requestContext: {
        accountId: 'anonymous',
        apiId: '6ymizjcq0j281tl4cdp99dgzg2kb4m08',
        domainName: '1pf127k4cafvof25jm7qm1bz8bit7ri8.lambda-url.us-east-1.on.aws',
        domainPrefix: '1pf127k4cafvof25jm7qm1bz8bit7ri8',
        http: {
          method: 'POST',
          path: '/',
          protocol: 'HTTP/1.1',
          sourceIp: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          userAgent:
            'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_10_2; en-US) AppleWebKit/536.2 (KHTML, like Gecko) Chrome/47.0.2772.124 Safari/537',
        },
        requestId: '1b4db7eb-4057-5ddf-91e0-36dec72071f5',
        routeKey: '$default',
        stage: '$default',
        time: '24/Nov/2024:05:11:06 +0000',
        timeEpoch: 1732425066259,
      },
      body: '',
      isBase64Encoded: false,
    };
  });

  it('Invalid request event should fail with parsed error', async () => {
    // @ts-expect-error
    const result = await lambdaHandler({});

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(500);
    expect(result.body).toBeDefined();

    const body = JSON.parse(result.body as string);
    expect(body).toEqual(
      expect.objectContaining({
        message: 'Internal Server Error',
        error: expect.anything(),
      }),
    );
  });

  /**
   * Test for invalid request methods
   */
  it('Valid GET request event should fail with method not allowed', async () => {
    const getEvent = Object.assign(baseEvent, { requestContext: { http: { method: 'GET' as const } } });

    const result = await lambdaHandler(getEvent);

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(405);
    expect(result.body).toBeDefined();
    expect(result.body).toEqual(
      JSON.stringify({
        message: 'Method Not Allowed',
        error: 'Method must be POST',
      }),
    );
  });
  it('Valid PUT request event should fail with method not allowed', async () => {
    const putEvent = Object.assign(baseEvent, { requestContext: { http: { method: 'PUT' as const } } });

    const result = await lambdaHandler(putEvent);

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(405);
    expect(result.body).toBeDefined();
    expect(result.body).toEqual(
      JSON.stringify({
        message: 'Method Not Allowed',
        error: 'Method must be POST',
      }),
    );
  });
  it('Valid DELETE request event should fail with method not allowed', async () => {
    const deleteEvent = Object.assign(baseEvent, { requestContext: { http: { method: 'DELETE' as const } } });

    const result = await lambdaHandler(deleteEvent);

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(405);
    expect(result.body).toBeDefined();
    expect(result.body).toEqual(
      JSON.stringify({
        message: 'Method Not Allowed',
        error: 'Method must be POST',
      }),
    );
  });
  it('Valid PATCH request event should fail with method not allowed', async () => {
    const patchEvent = Object.assign(baseEvent, { requestContext: { http: { method: 'PATCH' as const } } });

    const result = await lambdaHandler(patchEvent);

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(405);
    expect(result.body).toBeDefined();
    expect(result.body).toEqual(
      JSON.stringify({
        message: 'Method Not Allowed',
        error: 'Method must be POST',
      }),
    );
  });

  /**
   * Test for invalid content type
   */
  const invalidContentType = [
    'application/json',
    'application/javascript',
    'application/xml',
    'text/html',
    'text/plain',
    '(image/jpeg',
  ];
  for (const contentType of invalidContentType) {
    it(`Valid POST request event with invalid content type (${contentType}) should fail`, async () => {
      const invalidContentTypeEvent = Object.assign(baseEvent, { headers: { 'content-type': contentType } });

      const result = await lambdaHandler(invalidContentTypeEvent);

      if (typeof result === 'string') {
        throw new Error('Unexpected string response');
      }

      expect(result.statusCode).toEqual(400);
      expect(result.body).toBeDefined();
      expect(result.body).toEqual(
        JSON.stringify({
          message: 'Bad Request',
          error: 'Content-Type must be application/csp-report',
        }),
      );
    });
  }

  /**
   * Test for missing body
   */
  it('Valid POST request event with missing body should fail', async () => {
    const missingBodyEvent = Object.assign(baseEvent, { body: undefined });

    const result = await lambdaHandler(missingBodyEvent);

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(400);
    expect(result.body).toBeDefined();
    expect(result.body).toEqual(
      JSON.stringify({
        message: 'Bad Request',
        error: 'event.body is undefined!',
      }),
    );
  });

  /**
   * Test for invalid report-uri payload
   */
  it('Valid POST request event with invalid report-uri payload should fail', async () => {
    const invalidReportEvent = Object.assign(baseEvent, { body: 'invalid report' });

    const result = await lambdaHandler(invalidReportEvent);

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(400);
    expect(result.body).toBeDefined();

    const body = JSON.parse(result.body as string);
    expect(body).toEqual(
      expect.objectContaining({
        message: 'Bad Request',
        error: expect.anything(),
      }),
    );
  });

  /**
   * Test for valid report-uri payload
   */
  it('Valid POST request event, with base64 encoded CSP report should succeed', async () => {
    const result = await lambdaHandler(eventBase64 as unknown as LambdaFunctionURLEvent);

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual(
      JSON.stringify({
        message: 'Okay',
        error: null,
      }),
    );
  });
  it('Valid POST request event, with json encoded CSP report should succeed', async () => {
    const result = await lambdaHandler(eventJson as unknown as LambdaFunctionURLEvent);

    if (typeof result === 'string') {
      throw new Error('Unexpected string response');
    }

    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual(
      JSON.stringify({
        message: 'Okay',
        error: null,
      }),
    );
  });
});
