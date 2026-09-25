const FIREBASE_COPY_PREFIX = "feature_copy_";

type RemoteConfigValue = {
  getSource(): string;
  asString(): string;
};

export type ContentAbTestCopy = Readonly<Record<string, string>>;

export type ContentAbTestTrackingConfiguration = {
  ptxEventProperty: string;
  ptxEventValue: string;
};

export type ContentAbTestPayload = {
  enabled: boolean;
  copy: Record<string, string>;
  trackingConfiguration?: ContentAbTestTrackingConfiguration;
};

export type ContentAbTests = Readonly<Record<string, ContentAbTestPayload>>;

type Subscriber = (copy: ContentAbTestCopy) => void;

const EMPTY_COPY: ContentAbTestCopy = Object.freeze({});
const EMPTY_EXPERIMENTS: ContentAbTests = Object.freeze({});

let experiments: ContentAbTests = EMPTY_EXPERIMENTS;
let copy: ContentAbTestCopy = EMPTY_COPY;
const subscribers = new Set<Subscriber>();

export function getContentAbTestCopy(): ContentAbTestCopy {
  return copy;
}

export function getContentAbTests(): ContentAbTests {
  return experiments;
}

export function subscribeToContentAbTestCopy(callback: Subscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Reads copy experiments out of the feature-flag Remote Config payload. Called with the `getAll()`
 * result the flag fetch already produced, so copy costs no extra network round-trip and cannot
 * delay boot on its own.
 *
 * Experiments live under `feature_copy_*` keys, which `parseFirebaseFeatures` ignores because they
 * match no `FeatureId`. A missing, disabled or malformed payload yields no copy entry, leaving
 * `app.json` as the runtime copy. The full valid payload, including disabled experiments, is kept
 * for analytics.
 */
export function setContentAbTestCopy(all: Record<string, RemoteConfigValue>): ContentAbTestCopy {
  experiments = Object.freeze(parseContentAbTests(all));
  const next = buildContentAbTestCopy(experiments);
  if (isSameCopy(copy, next)) return copy;
  copy = next;
  subscribers.forEach(callback => callback(copy));
  return copy;
}

export function parseContentAbTestCopy(all: Record<string, RemoteConfigValue>): ContentAbTestCopy {
  return buildContentAbTestCopy(parseContentAbTests(all));
}

export function parseContentAbTests(
  all: Record<string, RemoteConfigValue>,
): Record<string, ContentAbTestPayload> {
  const parsed: Record<string, ContentAbTestPayload> = {};
  for (const [key, value] of Object.entries(all)) {
    if (value.getSource() !== "remote") continue;
    const id = firebaseKeyToContentAbTestId(key);
    if (!id) continue;

    let raw: unknown;
    try {
      raw = JSON.parse(value.asString());
    } catch {
      continue;
    }
    const payload = parseContentAbTestPayload(raw);
    if (payload) parsed[id] = payload;
  }
  return parsed;
}

export function parseContentAbTestPayload(value: unknown): ContentAbTestPayload | null {
  if (!isPlainObject(value) || typeof value.enabled !== "boolean") return null;

  const trackingConfiguration = parseTrackingConfiguration(value.trackingConfiguration);
  if (trackingConfiguration === "invalid") return null;

  return {
    enabled: value.enabled,
    copy: collectCopy(value),
    ...(trackingConfiguration ? { trackingConfiguration } : {}),
  };
}

function firebaseKeyToContentAbTestId(key: string): string | null {
  const lower = key.toLowerCase();
  if (!lower.startsWith(FIREBASE_COPY_PREFIX)) return null;
  const id = lower
    .slice(FIREBASE_COPY_PREFIX.length)
    .replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
  return id.length > 0 ? id : null;
}

function buildContentAbTestCopy(payloads: ContentAbTests): ContentAbTestCopy {
  const parsed: Record<string, string> = {};
  for (const payload of Object.values(payloads)) {
    if (!payload.enabled) continue;
    Object.assign(parsed, payload.copy);
  }
  return Object.keys(parsed).length === 0 ? EMPTY_COPY : Object.freeze(parsed);
}

function collectCopy(value: Record<string, unknown>): Record<string, string> {
  const collected: Record<string, string> = {};
  if (isPlainObject(value.copy)) {
    for (const [key, entry] of Object.entries(value.copy)) {
      if (typeof entry === "string") collected[key] = entry;
    }
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key === "enabled" || key === "copy" || key === "trackingConfiguration") continue;
    if (typeof entry === "string") collected[key] = entry;
  }
  return collected;
}

function parseTrackingConfiguration(
  value: unknown,
): ContentAbTestTrackingConfiguration | undefined | "invalid" {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) return "invalid";
  const { ptxEventProperty, ptxEventValue } = value;
  if (
    typeof ptxEventProperty !== "string" ||
    ptxEventProperty.length === 0 ||
    typeof ptxEventValue !== "string" ||
    ptxEventValue.length === 0
  ) {
    return "invalid";
  }
  return { ptxEventProperty, ptxEventValue };
}

function isSameCopy(current: ContentAbTestCopy, next: ContentAbTestCopy): boolean {
  const currentKeys = Object.keys(current);
  if (currentKeys.length !== Object.keys(next).length) return false;
  return currentKeys.every(key => current[key] === next[key]);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
