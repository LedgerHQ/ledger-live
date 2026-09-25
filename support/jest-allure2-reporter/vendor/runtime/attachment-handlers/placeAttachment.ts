import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { AttachmentContext, ContentAttachmentContext, FileAttachmentContext } from '../types';
import { getFullExtension } from '../../utils';

export function placeAttachment(context: AttachmentContext): string {
  const { outDir, name, sourcePath } = context as FileAttachmentContext & ContentAttachmentContext;
  const fileName = name || sourcePath || '';
  return path.join(outDir, randomUUID() + getFullExtension(fileName));
}
