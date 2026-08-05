import { GenuineCheckFailed } from "@ledgerhq/live-common/errors";
import { DmkError } from "@ledgerhq/live-dmk-desktop";

export function normalizeGenuineCheckError(error: Error | DmkError) {
  return new GenuineCheckFailed("", { cause: error });
}
