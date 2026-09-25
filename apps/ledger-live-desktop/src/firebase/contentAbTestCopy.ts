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

type CopySubscriber = (copy: ContentAbTestCopy) => void;
type ExperimentsSubscriber = (experiments: ContentAbTests) => void;

const EMPTY_COPY: ContentAbTestCopy = Object.freeze({});
const EMPTY_EXPERIMENTS: ContentAbTests = Object.freeze({});

let remote: Record<string, ContentAbTestPayload> = {};
let overrides: Record<string, ContentAbTestPayload> = {};
let experiments: ContentAbTests = EMPTY_EXPERIMENTS;
let copy: ContentAbTestCopy = EMPTY_COPY;
const copySubscribers = new Set<CopySubscriber>();
const experimentSubscribers = new Set<ExperimentsSubscriber>();

export function getContentAbTestCopy(): ContentAbTestCopy {
  return copy;
}

export function getContentAbTests(): ContentAbTests {
  return experiments;
}

export function subscribeToContentAbTestCopy(callback: CopySubscriber): () => void {
  copySubscribers.add(callback);
  return () => {
    copySubscribers.delete(callback);
  };
}

export function subscribeToContentAbTests(callback: ExperimentsSubscriber): () => void {
  experimentSubscribers.add(callback);
  return () => {
    experimentSubscribers.delete(callback);
  };
}

/**
 * Reads copy experiments out of the feature-flag Remote Config payload. Called with the `getAll()`
 * result the flag fetch already produced, so copy costs no extra network round-trip.
 *
 * Experiments live under `feature_copy_*` keys, which `parseFirebaseFeatures` ignores because they
 * match no `FeatureId`. Local debug overrides survive a later poll of the same template.
 */
export function setContentAbTestCopy(all: Record<string, RemoteConfigValue>): ContentAbTestCopy {
  remote = parseContentAbTests(all);
  return publish();
}

export function setContentAbTestOverride(
  id: string,
  value: ContentAbTestPayload | undefined,
): ContentAbTests {
  if (value === undefined) {
    const next = { ...overrides };
    delete next[id];
    overrides = next;
  } else {
    overrides = { ...overrides, [id]: value };
  }
  publish();
  return experiments;
}

export function clearContentAbTestOverrides(): ContentAbTests {
  overrides = {};
  publish();
  return experiments;
}

export function isContentAbTestOverridden(id: string): boolean {
  return Object.hasOwn(overrides, id);
}

export function hasContentAbTestOverrides(): boolean {
  return Object.keys(overrides).length > 0;
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

export function firebaseKeyToContentAbTestId(key: string): string | null {
  const lower = key.toLowerCase();
  if (!lower.startsWith(FIREBASE_COPY_PREFIX)) return null;
  const id = snakeSuffixToCamelId(lower.slice(FIREBASE_COPY_PREFIX.length));
  return id.length > 0 ? id : null;
}

function publish(): ContentAbTestCopy {
  const nextExperiments = Object.freeze({ ...remote, ...overrides });
  const nextCopy = buildContentAbTestCopy(nextExperiments);
  const experimentsChanged = !isSameExperiments(experiments, nextExperiments);
  const copyChanged = !isSameCopy(copy, nextCopy);

  if (!experimentsChanged && !copyChanged) return copy;

  if (experimentsChanged) {
    experiments = nextExperiments;
    experimentSubscribers.forEach(callback => callback(experiments));
  }
  if (copyChanged) {
    copy = nextCopy;
    copySubscribers.forEach(callback => callback(copy));
  }
  return copy;
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

function snakeSuffixToCamelId(suffix: string): string {
  return suffix.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function isSameCopy(current: ContentAbTestCopy, next: ContentAbTestCopy): boolean {
  const currentKeys = Object.keys(current);
  if (currentKeys.length !== Object.keys(next).length) return false;
  return currentKeys.every(key => current[key] === next[key]);
}

function isSameExperiments(current: ContentAbTests, next: ContentAbTests): boolean {
  const currentKeys = Object.keys(current);
  if (currentKeys.length !== Object.keys(next).length) return false;
  return currentKeys.every(key => isSamePayload(current[key], next[key]));
}

function isSamePayload(
  current: ContentAbTestPayload,
  next: ContentAbTestPayload | undefined,
): boolean {
  if (!next || current.enabled !== next.enabled) return false;
  if (!isSameCopy(current.copy, next.copy)) return false;
  return (
    current.trackingConfiguration?.ptxEventProperty ===
      next.trackingConfiguration?.ptxEventProperty &&
    current.trackingConfiguration?.ptxEventValue === next.trackingConfiguration?.ptxEventValue
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
