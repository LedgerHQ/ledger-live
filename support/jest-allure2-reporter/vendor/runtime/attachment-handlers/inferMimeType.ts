import { extname } from 'node:path';

import type { MIMEInferer } from '../types';

export const inferMimeType: MIMEInferer = (context) => {
  return context.sourcePath ? mimeTypes[extname(context.sourcePath)] : undefined;
};

const mimeTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',

  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',

  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.js': 'application/javascript',

  '.css': 'text/css',
  '.html': 'text/html',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.xml': 'text/xml',
};
