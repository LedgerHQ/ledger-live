import type { StepDescription } from '../../types';
import { msg } from '../../utils';
import type { DetoxMessage, Invocation } from '../detox-payload';
import { formatAction } from './action-formatters';
import { formatExpectation } from './expectation-formatters';
import { formatSystemAction, formatSystemExpectation } from './system-formatters';
import { formatWebAction, formatWebExpectation } from './web-formatters';

type MessageFormatter<T extends DetoxMessage> = (message: T) => StepDescription | null;

type MessageFormatterMap = {
  [K in DetoxMessage['type']]: MessageFormatter<Extract<DetoxMessage, { type: K }>>;
};

const messageFormatters: MessageFormatterMap = {
  invoke: (message) => {
    const invocation = message.params;
    return formatInvocation(invocation);
  },
  deliverPayload: (message) => {
    const data = message.params
      ? {
          url: message.params.url,
          delayPayload: message.params.delayPayload,
        }
      : undefined;

    return msg('Deliver payload', data);
  },
  systemAction: (message) => formatSystemAction(message),
  systemExpectation: (message) => formatSystemExpectation(message),
};

const formatInvocation = (invocation?: Invocation): StepDescription | null => {
  switch (invocation?.type) {
    case 'action': {
      return formatAction(invocation);
    }
    case 'expectation': {
      return formatExpectation(invocation);
    }
    case 'webAction': {
      return formatWebAction(invocation);
    }
    case 'webExpectation': {
      return formatWebExpectation(invocation);
    }
    default: {
      return null;
    }
  }
};

export const formatMessage = (message: DetoxMessage): StepDescription | null => {
  const formatter = messageFormatters[message.type];
  return formatter ? formatter(message as any) : null;
};
