// eslint-disable-next-line import/no-internal-modules
import { log } from 'detox/internals';
import type { OnErrorHandler, OnErrorHandlerFn } from '../types';

export function createErrorHandler(onError: OnErrorHandler): OnErrorHandlerFn {
  switch (onError) {
    case 'throw': {
      return throwError;
    }
    case 'ignore': {
      return ignoreError;
    }
    case 'warn': {
      return warnError;
    }
    default: {
      return onError;
    }
  }
}

function throwError(error: Error) {
  throw error;
}

function ignoreError(_error: Error) {
  // Do nothing
}

function warnError(error: Error) {
  log.warn({ cat: 'detox-allure2-adapter', err: error }, '[detox-allure2-adapter] Caught error:');
}
