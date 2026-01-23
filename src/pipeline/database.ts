/**
 * Database Fetcher
 * Fetches data from databases (MySQL, PostgreSQL, MongoDB)
 */

import { Fetcher } from './fetcher';
import { FetcherConfig, SourceConfig } from './types';

export interface DatabaseFetcherConfig extends FetcherConfig {
  source: SourceConfig & {
    type: 'database';
    connection: string;
    query: string;
    params?: any[];
  };
}

export class DatabaseFetcher extends Fetcher {
  private dbConfig: DatabaseFetcherConfig['source'];

  constructor(config: DatabaseFetcherConfig) {
    super(config);
    this.dbConfig = config.source;
  }

  /**
   * Fetch raw data from database
   */
  protected async fetchRawData(): Promise<any> {
    const connection = this.dbConfig.connection;
    const query = this.dbConfig.query;
    const params = this.dbConfig.params || [];

    // Detect database type from connection string
    if (connection.startsWith('mysql:') || connection.startsWith('mysql://')) {
      return await this.fetchFromMySQL(query, params);
    } else if (connection.startsWith('postgres:') || connection.startsWith('postgresql://')) {
      return await this.fetchFromPostgreSQL(query, params);
    } else if (connection.startsWith('mongodb:') || connection.startsWith('mongodb://')) {
      return await this.fetchFromMongoDB(query, params);
    } else {
      throw new Error(`Unsupported database type in connection string: ${connection}`);
    }
  }

  /**
   * Fetch data from MySQL
   */
  private async fetchFromMySQL(query: string, params: any[]): Promise<any> {
    try {
      // Dynamic import to make mysql2 optional
      const mysql = await import('mysql2/promise');

      const connection = await mysql.createConnection(this.dbConfig.connection);
      const [rows] = await connection.execute(query, params);
      await connection.end();

      return rows;
    } catch (error) {
      if ((error as any).code === 'MODULE_NOT_FOUND') {
        throw new Error('MySQL support requires mysql2 package. Install it with: npm install mysql2');
      }
      throw new Error(`MySQL query failed: ${error}`);
    }
  }

  /**
   * Fetch data from PostgreSQL
   */
  private async fetchFromPostgreSQL(query: string, params: any[]): Promise<any> {
    try {
      // Dynamic import to make pg optional
      const { Client } = await import('pg');

      const client = new Client({
        connectionString: this.dbConfig.connection,
      });

      await client.connect();
      const result = await client.query(query, params);
      await client.end();

      return result.rows;
    } catch (error) {
      if ((error as any).code === 'MODULE_NOT_FOUND') {
        throw new Error('PostgreSQL support requires pg package. Install it with: npm install pg');
      }
      throw new Error(`PostgreSQL query failed: ${error}`);
    }
  }

  /**
   * Fetch data from MongoDB
   */
  private async fetchFromMongoDB(query: string, params: any[]): Promise<any> {
    try {
      // Dynamic import to make mongodb optional
      const { MongoClient } = await import('mongodb');

      const client = new MongoClient(this.dbConfig.connection);
      await client.connect();

      const db = client.db();
      const collectionName = this.extractCollectionName(query);
      const collection = db.collection(collectionName);

      // Parse query (simplified, assumes query is in JSON format)
      const filter = this.parseMongoQuery(query);
      const result = await collection.find(filter || {}).toArray();

      await client.close();

      return result;
    } catch (error) {
      if ((error as any).code === 'MODULE_NOT_FOUND') {
        throw new Error('MongoDB support requires mongodb package. Install it with: npm install mongodb');
      }
      throw new Error(`MongoDB query failed: ${error}`);
    }
  }

  /**
   * Extract collection name from MongoDB query
   */
  private extractCollectionName(query: string): string {
    // Simplified: assume query contains collection name
    // In production, would parse more carefully
    const match = query.match(/collection\s*[:=]\s*['"]([^'"]+)['"]/i);
    if (match) {
      return match[1];
    }
    throw new Error('Could not extract collection name from MongoDB query');
  }

  /**
   * Parse MongoDB query filter
   */
  private parseMongoQuery(query: string): any {
    try {
      // Try to parse as JSON
      return JSON.parse(query);
    } catch {
      // If not JSON, return empty filter
      return {};
    }
  }
}
