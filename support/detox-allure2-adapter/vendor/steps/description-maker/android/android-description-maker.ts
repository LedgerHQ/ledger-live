import { StepDescription, StepDescriptionMaker } from '../types';
import { AndroidDescriptionProcessor } from './core';

/**
 * The main entry point for the Android Description Maker.
 * Implements a pseudo-compiler pattern to process invocation trees.
 */
export const androidDescriptionMaker: StepDescriptionMaker = (
  payload: unknown,
): StepDescription | null => {
  const processor = new AndroidDescriptionProcessor();
  return processor.process(payload);
};
