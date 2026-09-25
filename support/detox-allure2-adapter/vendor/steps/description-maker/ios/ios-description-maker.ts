import type { StepDescriptionMaker } from '../types';
import type { DetoxMessage } from './detox-payload';
import { formatMessage } from './formatters';

export const iosDescriptionMaker: StepDescriptionMaker = (payload: unknown) => {
  const message = payload as DetoxMessage;
  return formatMessage(message);
};
