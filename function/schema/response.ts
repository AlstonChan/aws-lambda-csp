import type { JTDSchemaType } from 'ajv/dist/jtd';

interface Response {
  message: string;
  error: string | null;
}

export const responseSchema: JTDSchemaType<Response> = {
  properties: {
    message: { type: 'string' },
    error: { type: 'string', nullable: true },
  },
};
