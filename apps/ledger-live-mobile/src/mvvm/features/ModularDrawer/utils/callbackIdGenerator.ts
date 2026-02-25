/**
 * Generates a unique callback ID for the callback registry.
 * This ensures each callback has a unique identifier to avoid conflicts.
 */
export const generateCallbackId = (): string => {
  return `callback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
