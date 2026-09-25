import path from 'node:path';

import type { FileAttachmentHandler } from '../types';

export const referenceHandler: FileAttachmentHandler = ({ sourcePath }) => path.resolve(sourcePath);
