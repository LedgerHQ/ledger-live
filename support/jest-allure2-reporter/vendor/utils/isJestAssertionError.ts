/* eslint-disable-next-line node/no-unpublished-import */
import type { JestAssertionError } from 'expect';

import { isObject } from './vendor';

export function isJestAssertionError(error: unknown): error is JestAssertionError {
  return isObject(error) && 'matcherResult' in (error as unknown as JestAssertionError);
}
