import {
  parseContentAbTestCopy,
  type ContentAbTestCopy,
  type RemoteConfigValue,
} from "@features/platform-feature-flags/firebase";

export type { ContentAbTestCopy };

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
 * A missing, disabled or malformed experiment leaves `app.json` as the runtime copy.
 */
export function setContentAbTestCopy(all: Record<string, RemoteConfigValue>): ContentAbTestCopy {
  const next = parseContentAbTestCopy(all);
  if (isSameCopy(copy, next)) return copy;
  copy = next;
  subscribers.forEach(callback => callback(copy));
  return copy;
}

function isSameCopy(current: ContentAbTestCopy, next: ContentAbTestCopy): boolean {
  const currentKeys = Object.keys(current);
  if (currentKeys.length !== Object.keys(next).length) return false;
  return currentKeys.every(key => current[key] === next[key]);
}
