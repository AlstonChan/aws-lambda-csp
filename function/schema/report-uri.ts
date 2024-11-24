import type { JTDSchemaType } from 'ajv/dist/jtd';
import type { ContentSecurityPolicyLevelThreeReportUri } from './report';

export const reportUriSchema: JTDSchemaType<ContentSecurityPolicyLevelThreeReportUri> = {
  metadata: {
    title: 'JSON Schema for Content Security Policy (Level 3) report-uri violation report',
    description: 'https://www.w3.org/TR/CSP3/#deprecated-serialize-violation',
  },
  properties: {
    'csp-report': {
      properties: {
        'document-uri': {
          type: 'string',
          metadata: {
            description: 'The address of the protected resource, stripped for reporting.',
          },
        },
        referrer: {
          type: 'string',
          metadata: {
            description:
              'The referrer attribute of the protected resource, or the empty string if the protected resource has no referrer.',
          },
        },
        'blocked-uri': {
          type: 'string',
          metadata: {
            description:
              'The originally requested URL of the resource that was prevented from loading, stripped for reporting, or the empty string if the resource has no URL (inline script and inline style, for example).',
          },
        },
        'effective-directive': {
          type: 'string',
          metadata: {
            description:
              'The name of the policy directive that was violated. This will contain the directive whose enforcement triggered the violation (e.g. "script-src") even if that directive does not explicitly appear in the policy, but is implicitly activated via the default-src directive.',
          },
        },
        'violated-directive': {
          type: 'string',
          metadata: {
            description:
              'The policy directive that was violated, as it appears in the policy. This will contain the default-src directive in the case of violations caused by falling back to the default sources when enforcing a directive.',
          },
        },
        'original-policy': {
          type: 'string',
          metadata: {
            description: 'The original policy, as received by the user agent.',
          },
        },
        disposition: {
          enum: ['enforce', 'report'],
          metadata: {
            description: 'Each policy has an associated disposition, which is either "enforce" or "report".',
          },
        },
        'status-code': {
          type: 'uint16',
          metadata: {
            description:
              'The status-code of the HTTP response that contained the protected resource, if the protected resource was obtained over HTTP. Otherwise, the number 0.',
          },
        },
        'script-sample': {
          type: 'string',
          metadata: {
            description: 'An empty string unless otherwise specified.',
          },
        },
        'source-file': {
          nullable: true,
          type: 'string',
          metadata: {
            description:
              'The URL of the resource where the violation occurred, stripped for reporting. null if it does not exists',
          },
        },
        'line-number': {
          type: 'uint32',
          metadata: {
            description:
              'The line number in source-file on which the violation occurred, which is a a non-negative integer.',
          },
        },
        'column-number': {
          type: 'uint32',
          metadata: {
            description:
              'The column number in source-file on which the violation occurred, which is a a non-negative integer.',
          },
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;
