export type ContentSecurityPolicyFetchDirectives =
  | 'child-src'
  | 'connect-src'
  | 'default-src'
  | 'font-src'
  | 'frame-src'
  | 'img-src'
  | 'manifest-src'
  | 'media-src'
  | 'object-src'
  | 'script-src'
  | 'script-src-elem'
  | 'script-src-attr'
  | 'style-src'
  | 'style-src-elem'
  | 'style-src-attr';
export type ContentSecurityPolicyOtherDirectives = 'webrtc' | 'worker-src';
export type ContentSecurityPolicyDocumentDirectives = 'base-uri' | 'sandbox';
export type ContentSecurityPolicyNavigationDirectives = 'form-action' | 'frame-ancestors';
export type ContentSecurityPolicyReportingDirectives = 'report-uri' | 'report-to';

/**
 * The directives available for CSP
 * @see https://www.w3.org/TR/CSP3/#csp-directives
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#directives
 */
export type ContentSecurityPolicyDirectives =
  | ContentSecurityPolicyFetchDirectives
  | ContentSecurityPolicyOtherDirectives
  | ContentSecurityPolicyDocumentDirectives
  | ContentSecurityPolicyNavigationDirectives
  | ContentSecurityPolicyReportingDirectives;

/**
 * The content security policy level three report uri schema
 */
export interface ContentSecurityPolicyLevelThreeReportUri {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'blocked-uri': string;
    'effective-directive': string;
    'violated-directive': string;
    'original-policy': string;
    disposition: 'enforce' | 'report';
    'status-code': number;
    'script-sample': string;
    'source-file': string | null;
    'line-number': number;
    'column-number': number;
  };
}
