import { v4 as uuid } from "uuid";

/**
 * Generates a unique callback ID for the callback registry.
 * This ensures each callback has a unique identifier to avoid conflicts.
 */
export const generateCallbackId = (): string => {
  return `callback_${uuid()}`;
};
