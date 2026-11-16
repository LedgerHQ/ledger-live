import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";

export type DescendingCursor = { highestOffset: number; windowWidth: number };

const DESCENDING_CURSOR = /^(\d+):(\d+)$/;
const OFFSET = /^\d+$/;

function invalidCursor(cursor: string): InvalidParameterError {
  return new InvalidParameterError(`canton: invalid listOperations cursor "${cursor}"`);
}

function toSafeInteger(digits: string, cursor: string): number {
  const value = Number(digits);
  if (!Number.isSafeInteger(value)) throw invalidCursor(cursor);
  return value;
}

export function encodeDescendingCursor({ highestOffset, windowWidth }: DescendingCursor): string {
  return `${highestOffset}:${windowWidth}`;
}

export function decodeDescendingCursor(cursor: string): DescendingCursor {
  const [, highestOffset, windowWidth] = DESCENDING_CURSOR.exec(cursor) ?? [];
  if (highestOffset === undefined || windowWidth === undefined) throw invalidCursor(cursor);
  const decoded = {
    highestOffset: toSafeInteger(highestOffset, cursor),
    windowWidth: toSafeInteger(windowWidth, cursor),
  };
  if (decoded.windowWidth < 1) throw invalidCursor(cursor);
  return decoded;
}

export function decodeAscendingCursor(cursor: string): number {
  if (!OFFSET.test(cursor)) throw invalidCursor(cursor);
  return toSafeInteger(cursor, cursor);
}
