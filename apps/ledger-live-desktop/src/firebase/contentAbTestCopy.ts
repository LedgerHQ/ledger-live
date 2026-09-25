const FIREBASE_COPY_PREFIX = "feature_copy_";

type RemoteConfigValue = {
  getSource(): string;
  asString(): string;
};

export type ContentAbTestCopy = Readonly<Record<string, string>>;

type Subscriber = (copy: ContentAbTestCopy) => void;

const EMPTY_COPY: ContentAbTestCopy = Object.freeze({});

let copy: ContentAbTestCopy = EMPTY_COPY;
const subscribers = new Set<Subscriber>();

export function getContentAbTestCopy(): ContentAbTestCopy {
  return copy;
}

export function subscribeToContentAbTestCopy(callback: Subscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Reads the Engagement copy experiments out of the feature-flag Remote Config payload. Called
 * with the `getAll()` result the flag fetch already produced, so copy costs no extra network
 * round-trip and cannot delay boot on its own.
 *
 * Experiments live under `feature_copy_*` keys, which `parseFirebaseFeatures` ignores because
 * they match no `FeatureId`. A missing, disabled or malformed payload yields no entry, leaving
 * `app.json` as the runtime copy.
 */
export function setContentAbTestCopy(all: Record<string, RemoteConfigValue>): ContentAbTestCopy {
  const next = parseContentAbTestCopy(all);
  if (isSameCopy(copy, next)) return copy;
  copy = next;
  subscribers.forEach(callback => callback(copy));
  return copy;
}

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
    if (!isPlainObject(payload) || payload.enabled !== true) continue;

    collectCopyInto(parsed, payload);
  }
  return Object.freeze(parsed);
}

function collectCopyInto(target: Record<string, string>, payload: Record<string, unknown>): void {
  if (isPlainObject(payload.copy)) {
    for (const [key, entry] of Object.entries(payload.copy)) {
      if (typeof entry === "string") target[key] = entry;
    }
  }
  for (const [key, entry] of Object.entries(payload)) {
    if (key === "enabled" || key === "copy") continue;
    if (typeof entry === "string") target[key] = entry;
  }
}

function isSameCopy(current: ContentAbTestCopy, next: ContentAbTestCopy): boolean {
  const currentKeys = Object.keys(current);
  if (currentKeys.length !== Object.keys(next).length) return false;
  return currentKeys.every(key => current[key] === next[key]);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
