declare module 'follow-redirects' {
  import { IncomingMessage, ServerResponse, ClientRequest, RequestOptions } from 'http';

  export interface HttpsProxyAgentOptions {
    host: string;
    port: number;
    protocol?: string;
    headers?: Record<string, string>;
  }

  export interface Options extends RequestOptions {
    maxRedirects?: number;
    beforeRedirect?: (options: RequestOptions, response: IncomingMessage, request: ClientRequest) => void;
    followRedirects?: boolean;
    agents?: {
      http?: any;
      https?: any;
    };
    trackRedirects?: boolean;
  }

  export interface WrappedRequest extends ClientRequest {
    response?: IncomingMessage;
    redirects?: string[];
    redirectUrls?: string[];
  }

  export interface IncomingMessageWithRedirects extends IncomingMessage {
    response?: IncomingMessageWithRedirects;
    redirects?: string[];
    redirectUrls?: string[];
  }

  export const http: {
    request: (
      options: Options | string | URL,
      callback?: (res: IncomingMessageWithRedirects) => void
    ) => WrappedRequest;
    get: (
      options: Options | string | URL,
      callback?: (res: IncomingMessageWithRedirects) => void
    ) => WrappedRequest;
  };

  export const https: {
    request: (
      options: Options | string | URL,
      callback?: (res: IncomingMessageWithRedirects) => void
    ) => WrappedRequest;
    get: (
      options: Options | string | URL,
      callback?: (res: IncomingMessageWithRedirects) => void
    ) => WrappedRequest;
  };
}
