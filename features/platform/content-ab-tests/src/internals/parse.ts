import type { RemoteConfigValue } from "@features/platform-feature-flags/firebase";
import { EnabledContentAbTestCopySchema } from "./schema";

const FIREBASE_COPY_PREFIX = "feature_copy_";

type ContentAbTestCopy = Readonly<Record<string, string>>;

/**
 * Reads enabled `feature_copy_*` experiments from a Remote Config `getAll()` payload.
 *
 * These keys match no feature-flag id, so the flag parser ignores them. Only string entries
 * inside `copy` are returned. A missing, disabled or malformed payload is skipped, and
 * translation keys placed beside `copy` are ignored.
 */
export function parseContentAbTestCopy(all: Record<string, RemoteConfigValue>): ContentAbTestCopy {
  const parsed: Record<string, string> = {};
  for (const [key, value] of Object.entries(all)) {
    if (value.getSource() !== "remote") continue;
    if (!key.toLowerCase().startsWith(FIREBASE_COPY_PREFIX)) continue;

    let payload: unknown;
    try {
      payload = JSON.parse(value.asString());
    } catch {
      continue;
    }
    const experiment = EnabledContentAbTestCopySchema.safeParse(payload);
    if (!experiment.success) continue;
    Object.assign(parsed, experiment.data.copy);
  }
  return Object.freeze(parsed);
}
