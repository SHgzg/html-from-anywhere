/**
 * Image Processor
 * Processes and embeds images in HTML
 */

import { Processor } from './base';
import { ProcessedData, ImageOptions } from '../types';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import axios from 'axios';
import * as path from 'path';

export class ImageProcessor extends Processor {
  private options: ImageOptions;

  constructor(options: ImageOptions) {
    super();
    this.options = options;
  }

  /**
   * Process image into embeddable HTML
   */
  async process(data: any): Promise<ProcessedData> {
    // Determine image source
    const imageSource = this.getImageSource(data);

    let html: string;

    switch (this.options.format) {
      case 'base64':
        html = await this.processAsBase64(imageSource);
        break;
      case 'cid':
        html = this.processAsCid(imageSource);
        break;
      case 'url':
        html = this.processAsUrl(imageSource);
        break;
      default:
        throw new Error(`Unknown image format: ${this.options.format}`);
    }

    return this.createProcessedData('image', html, {
      format: this.options.format,
      width: this.options.width,
      height: this.options.height,
    });
  }

  /**
   * Get image source from data
   */
  private getImageSource(data: any): string {
    if (typeof data === 'string') {
      return data;
    }
    if (data?.url) {
      return data.url;
    }
    if (data?.path) {
      return data.path;
    }
    throw new Error('Could not determine image source from data');
  }

  /**
   * Process image as base64
   */
  private async processAsBase64(source: string): Promise<string> {
    let imageBuffer: Buffer;
    let mimeType = 'image/jpeg';

    // Check if source is URL or file path
    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Download from URL
      const response = await axios.get<ArrayBuffer>(source, {
        responseType: 'arraybuffer',
      });
      imageBuffer = Buffer.from(response.data);

      // Try to determine mime type from content-type header
      const contentType = response.headers['content-type'];
      if (contentType) {
        mimeType = contentType.split(';')[0];
      }
    } else {
      // Read from file
      if (!existsSync(source)) {
        throw new Error(`Image file not found: ${source}`);
      }
      imageBuffer = await readFile(source);

      // Determine mime type from file extension
      const ext = path.extname(source).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };
      mimeType = mimeMap[ext] || 'image/jpeg';
    }

    // Convert to base64
    const base64 = imageBuffer.toString('base64');

    // Generate img tag
    const attrs = this.getImageAttributes();
    return `<img src="data:${mimeType};base64,${base64}"${attrs} />`;
  }

  /**
   * Process image as CID (for email attachments)
   */
  private processAsCid(source: string): string {
    // Extract filename from source
    const filename = source.split('/').pop() || 'image.jpg';
    const cid = `img_${Date.now()}_${filename}`;

    const attrs = this.getImageAttributes();
    return `<img src="cid:${cid}"${attrs} />`;
  }

  /**
   * Process image as URL
   */
  private processAsUrl(source: string): string {
    const attrs = this.getImageAttributes();
    return `<img src="${source}"${attrs} />`;
  }

  /**
   * Get image attributes
   */
  private getImageAttributes(): string {
    const attrs: string[] = [];

    if (this.options.width) {
      attrs.push(` width="${this.options.width}"`);
    }
    if (this.options.height) {
      attrs.push(` height="${this.options.height}"`);
    }
    if (this.options.border) {
      attrs.push(` style="border: ${this.options.border.width || 1}px ${this.options.border.style || 'solid'} ${this.options.border.color || '#000'};"`);
    }

    return attrs.join(' ');
  }
}
