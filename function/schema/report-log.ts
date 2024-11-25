import type { JTDSchemaType } from 'ajv/dist/jtd';
import type { ContentSecurityPolicyLevelThreeReportUri } from './report';
import { reportUriSchema } from './report-uri';

interface ReportLog extends ContentSecurityPolicyLevelThreeReportUri {
  'csp-report': ContentSecurityPolicyLevelThreeReportUri['csp-report'] & {
    userAgent?: string;
    clientIp?: string;
  };
}

export const reportLogSchema: JTDSchemaType<ReportLog> = {
  metadata: {
    title: 'JSON Schema for storing the CSP violation report to CloudWatch log',
  },
  properties: {
    'csp-report': {
      properties: {
        ...reportUriSchema.properties['csp-report'].properties,
      },
      optionalProperties: {
        userAgent: {
          type: 'string',
          metadata: {
            description: 'The User-Agent header of the client that triggered the report.',
          },
        },
        clientIp: {
          type: 'string',
          metadata: {
            description: 'The IP address of the client that triggered the report.',
          },
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};
