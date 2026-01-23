/**
 * Type declarations for optional dependencies
 */

declare module 'pg' {
  interface ClientConfig {
    connectionString?: string;
  }

  class Client {
    constructor(config: ClientConfig);
    connect(): Promise<void>;
    query(query: string, params?: any[]): Promise<{ rows: any[] }>;
    end(): Promise<void>;
  }

  export { Client };
}

declare module 'mysql2/promise' {
  interface Connection {
    execute(query: string, params?: any[]): Promise<[any, any]>;
    end(): Promise<void>;
  }

  export function createConnection(connection: string): Promise<Connection>;
}

declare module 'mongodb' {
  class MongoClient {
    constructor(connection: string);
    connect(): Promise<void>;
    db(): any;
    close(): Promise<void>;
  }

  export { MongoClient };
}
