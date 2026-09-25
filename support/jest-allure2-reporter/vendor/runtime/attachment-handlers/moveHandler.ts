import type { FileAttachmentHandler } from '../types';
import { fastMove } from '../../utils';

import { placeAttachment } from './placeAttachment';

export const moveHandler: FileAttachmentHandler = async (context) => {
  const destination = placeAttachment(context);
  await fastMove(context.sourcePath, destination);
  return destination;
};
