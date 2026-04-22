import { GenuineCheckFailed } from "@ledgerhq/errors";
import { DmkError } from "@ledgerhq/live-dmk-desktop";

export function normalizeGenuineCheckError(error: Error | DmkError) {
  return new GenuineCheckFailed("", undefined, { cause: error });
}
