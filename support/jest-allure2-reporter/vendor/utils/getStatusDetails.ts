import type { StatusDetails } from '@support/jest-allure2-reporter';

import { autoIndent } from './autoIndent';
import { isError } from './vendor';

const HAS_EMPTY_FIRST_LINE = /^\s*\n/;

export function getStatusDetails(maybeError: unknown): StatusDetails | undefined {
  if (!maybeError) {
    return;
  }

  const trace = getTrace(maybeError);
  const stackIndex = trace.indexOf('\n    at ');
  return stackIndex === -1
    ? {
        message: trace,
      }
    : {
        message: trace.slice(0, stackIndex),
        trace: autoIndent(trace).slice(stackIndex + 1),
      };
}

function getTrace(maybeError: unknown): string {
  if (typeof maybeError === 'string') {
    return maybeError;
  }

  const error = maybeError as Error;
  if (isError(maybeError)) {
    return restoreStack(error);
  }

  return asString(error.stack) || asString(error.message) || JSON.stringify(error);
}

function restoreStack(error: Error): string {
  const { message, name, stack } = normalizeError(error);
  if (stack && message && hasEmptyFirstLine(stack) && !HAS_EMPTY_FIRST_LINE.test(message)) {
    return `${name}: ${message}${stack.slice(stack.indexOf('\n'))}`;
  }

  return stack || String(error);
}

function hasEmptyFirstLine(stack: string): boolean {
  if (!stack.includes('\n')) {
    return false;
  }

  const firstLine = stack.slice(0, stack.indexOf('\n'));
  const [, after] = firstLine.trimEnd().split(':', 2);
  return !after;
}

function normalizeError(error: Error) {
  return {
    message: asString(error.message),
    name: asString(error.name),
    stack: asString(error.stack),
  };
}

function asString(x: unknown): string {
  return x ? String(x) : '';
}
