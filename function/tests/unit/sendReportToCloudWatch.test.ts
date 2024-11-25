// External Modules
import { expect, describe, it, beforeEach } from '@jest/globals';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { mockClient } from 'aws-sdk-client-mock';

// Test Target
import { sendReportToCloudWatch } from '../../app';
import type { ContentSecurityPolicyLevelThreeReportUri } from '../../schema/report';

// Mock the AWS clients
const cloudWatchMock = mockClient(CloudWatchClient);
const cloudWatchLogsMock = mockClient(CloudWatchLogsClient);

// Sample CSP report
const sampleCSPReport: ContentSecurityPolicyLevelThreeReportUri = {
  'csp-report': {
    'document-uri': 'https://www.example.com/',
    referrer: '',
    'violated-directive': 'connect-src',
    'effective-directive': 'connect-src',
    'original-policy': "default-src 'self' https://www.example.com",
    disposition: 'report',
    'blocked-uri': 'https://example.com/js/script.js',
    'line-number': 3,
    'column-number': 26,
    'source-file': 'https://www.example.com/run.js',
    'status-code': 200,
    'script-sample': '',
  },
};

describe('sendReportToCloudWatch', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    cloudWatchMock.reset();
    cloudWatchLogsMock.reset();

    // Reset process.env before each test
    process.env = {};
  });

  it('should do nothing when no configs are present', async () => {
    const stringifiedReport = JSON.stringify(sampleCSPReport);

    await sendReportToCloudWatch(stringifiedReport, sampleCSPReport);

    // Verify no calls were made
    expect(cloudWatchMock.calls()).toHaveLength(0);
    expect(cloudWatchLogsMock.calls()).toHaveLength(0);
  });

  it('no aws call will ever happen if region config is missing and all other env is present', async () => {
    // Set up environment variables
    process.env.LOG_GROUP_NAME = 'test-group';
    process.env.LOG_STREAM_NAME = 'test-stream';
    process.env.METRIC_NAMESPACE = 'test-namespace';
    process.env.METRIC_NAME = 'test-metric';

    const stringifiedReport = JSON.stringify(sampleCSPReport);

    await sendReportToCloudWatch(stringifiedReport, sampleCSPReport);

    // Verify that no calls were made
    expect(cloudWatchLogsMock.calls()).toHaveLength(0);
    expect(cloudWatchMock.calls()).toHaveLength(0);
  });

  it('should send only logs when metric config is missing', async () => {
    // Set up environment variables
    process.env.REGION = 'us-east-1';
    process.env.LOG_GROUP_NAME = 'test-group';
    process.env.LOG_STREAM_NAME = 'test-stream';

    const stringifiedReport = JSON.stringify(sampleCSPReport);

    await sendReportToCloudWatch(stringifiedReport, sampleCSPReport);

    // Verify that only logs were sent
    expect(cloudWatchLogsMock.calls()).toHaveLength(1);
    expect(cloudWatchMock.calls()).toHaveLength(0);

    // Verify the log content
    const logCall = cloudWatchLogsMock.call(0);
    expect(logCall.args[0].input).toMatchObject({
      logGroupName: 'test-group',
      logStreamName: 'test-stream',
      logEvents: expect.arrayContaining([
        expect.objectContaining({
          message: stringifiedReport,
        }),
      ]),
    });
  });

  it('should send only metrics when log config is missing', async () => {
    // Set up environment variables
    process.env.REGION = 'us-east-1';
    process.env.METRIC_NAMESPACE = 'test-namespace';
    process.env.METRIC_NAME = 'test-metric';

    const stringifiedReport = JSON.stringify(sampleCSPReport);

    await sendReportToCloudWatch(stringifiedReport, sampleCSPReport);

    // Verify that only metrics were sent
    expect(cloudWatchMock.calls()).toHaveLength(1);
    expect(cloudWatchLogsMock.calls()).toHaveLength(0);

    // Verify the metric content
    const metricCall = cloudWatchMock.call(0);
    expect(metricCall.args[0].input).toMatchObject({
      Namespace: 'test-namespace',
      MetricData: [
        {
          MetricName: 'test-metric',
          Dimensions: [
            {
              Name: 'ViolatedDirective',
              Value: 'connect-src',
            },
            {
              Name: 'SourceFile',
              Value: 'https://www.example.com/run.js',
            },
            {
              Name: 'BlockedUri',
              Value: 'https://example.com/js/script.js',
            },
            {
              Name: 'DocumentUri',
              Value: 'https://www.example.com/',
            },
          ],
          Value: 1,
          Unit: 'Count',
        },
      ],
    });
  });

  it('should send both logs and metrics when both configs are present', async () => {
    // Set up environment variables
    process.env.REGION = 'us-east-1';
    process.env.LOG_GROUP_NAME = 'test-group';
    process.env.LOG_STREAM_NAME = 'test-stream';
    process.env.METRIC_NAMESPACE = 'test-namespace';
    process.env.METRIC_NAME = 'test-metric';

    const stringifiedReport = JSON.stringify(sampleCSPReport);

    await sendReportToCloudWatch(stringifiedReport, sampleCSPReport);

    // Verify both logs and metrics were sent
    expect(cloudWatchLogsMock.calls()).toHaveLength(1);
    expect(cloudWatchMock.calls()).toHaveLength(1);

    const logCall = cloudWatchLogsMock.call(0);
    expect(logCall.args[0].input).toMatchObject({
      logGroupName: 'test-group',
      logStreamName: 'test-stream',
      logEvents: expect.arrayContaining([
        expect.objectContaining({
          message: stringifiedReport,
        }),
      ]),
    });

    const metricCall = cloudWatchMock.call(0);
    expect(metricCall.args[0].input).toMatchObject({
      Namespace: 'test-namespace',
      MetricData: [
        {
          MetricName: 'test-metric',
          Dimensions: [
            {
              Name: 'ViolatedDirective',
              Value: 'connect-src',
            },
            {
              Name: 'SourceFile',
              Value: 'https://www.example.com/run.js',
            },
            {
              Name: 'BlockedUri',
              Value: 'https://example.com/js/script.js',
            },
            {
              Name: 'DocumentUri',
              Value: 'https://www.example.com/',
            },
          ],
          Value: 1,
          Unit: 'Count',
        },
      ],
    });
  });
});
