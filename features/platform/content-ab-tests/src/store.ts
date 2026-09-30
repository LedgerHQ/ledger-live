import type { RemoteConfigValue } from "@features/platform-feature-flags/firebase";
import { parseContentAbTestCopy } from "./internals/parse";
import { EnabledContentAbTestCopySchema } from "./internals/schema";

export type ContentAbTestCopy = Readonly<Record<string, string>>;

export type ContentAbTestTrackingConfiguration = Record<string, string>;

export type ContentAbTestPayload = {
  enabled: boolean;
  copy: Record<string, string>;
  trackingConfiguration?: ContentAbTestTrackingConfiguration;
};

export type ContentAbTests = Readonly<Record<string, ContentAbTestPayload>>;

type CopySubscriber = (copy: ContentAbTestCopy) => void;
type ExperimentsSubscriber = (experiments: ContentAbTests) => void;

const FIREBASE_COPY_PREFIX = "feature_copy_";
const EMPTY_COPY: ContentAbTestCopy = Object.freeze({});
const EMPTY_EXPERIMENTS: ContentAbTests = Object.freeze({});
const ENGLISH_LANGUAGE = "en";

let remote: Record<string, ContentAbTestPayload> = {};
let remoteCopy: ContentAbTestCopy = EMPTY_COPY;
let overrides: Record<string, ContentAbTestPayload> = {};
let experiments: ContentAbTests = EMPTY_EXPERIMENTS;
let copy: ContentAbTestCopy = EMPTY_COPY;
const copySubscribers = new Set<CopySubscriber>();
const experimentSubscribers = new Set<ExperimentsSubscriber>();

type TranslationEngine = {
  language: string;
  resolvedLanguage?: string;
  addResource(
    language: string,
    namespace: string,
    key: string,
    value: string,
    options: { silent: boolean },
  ): void;
  on(event: "languageChanged", callback: (language: string) => void): void;
};

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
 * Stores copy experiments from the feature-flag Remote Config payload. Called with the `getAll()`
 * result the flag fetch already produced, so copy costs no extra network round-trip.
 *
 * Applied copy comes from the shared parser. Local debug overrides survive a later poll of the
 * same template and replace that copy while they are set.
 */
export function setContentAbTestCopy(all: Record<string, RemoteConfigValue>): ContentAbTestCopy {
  remote = parseContentAbTests(all);
  remoteCopy = parseContentAbTestCopy(all);
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

export function parseContentAbTestPayload(value: unknown): ContentAbTestPayload | null {
  if (!isPlainObject(value) || typeof value.enabled !== "boolean") return null;

  const copyRecord = value.enabled ? enabledCopy(value) : parseCopyRecord(value.copy);
  if (!copyRecord) return null;

  const trackingConfiguration = trackingConfigurationFrom(value.trackingConfiguration);
  return {
    enabled: value.enabled,
    copy: copyRecord,
    ...(trackingConfiguration ? { trackingConfiguration } : {}),
  };
}

export function installContentAbTestCopyOverrides(
  i18nInstance: TranslationEngine,
  englishBaseline: object,
  namespace: string,
): void {
  const baselineSnapshot = cloneTranslationTree(englishBaseline);
  let appliedKeys = new Set<string>();

  const applyCopyOverrides = (language: string) => {
    for (const key of appliedKeys) {
      const baselineValue = getTranslationValue(baselineSnapshot, key);
      if (baselineValue !== undefined) {
        i18nInstance.addResource(ENGLISH_LANGUAGE, namespace, key, baselineValue, { silent: true });
      }
    }
    appliedKeys = new Set();

    if (!isEnglish(language)) return;
    for (const [key, value] of Object.entries(getContentAbTestCopy())) {
      if (getTranslationValue(baselineSnapshot, key) === undefined) continue;
      i18nInstance.addResource(ENGLISH_LANGUAGE, namespace, key, value, {
        silent: true,
      });
      appliedKeys.add(key);
    }
  };

  const onLanguageChanged = (language: string) => {
    applyCopyOverrides(language);
  };

  i18nInstance.on("languageChanged", onLanguageChanged);
  applyCopyOverrides(i18nInstance.resolvedLanguage ?? i18nInstance.language);

  subscribeToContentAbTestCopy(() => {
    applyCopyOverrides(i18nInstance.resolvedLanguage ?? i18nInstance.language);
  });
}

function parseContentAbTests(
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

function enabledCopy(value: Record<string, unknown>): Record<string, string> | null {
  const experiment = EnabledContentAbTestCopySchema.safeParse(value);
  return experiment.success ? experiment.data.copy : null;
}

function publish(): ContentAbTestCopy {
  const nextExperiments = Object.freeze({ ...remote, ...overrides });
  const nextCopy =
    Object.keys(overrides).length === 0 ? remoteCopy : buildContentAbTestCopy(nextExperiments);
  const experimentsChanged = !isSameExperiments(experiments, nextExperiments);
  const copyChanged = !isSameCopy(copy, nextCopy);

  if (!experimentsChanged && !copyChanged) return copy;

  if (experimentsChanged) {
    experiments = nextExperiments;
    experimentSubscribers.forEach(callback => callback(experiments));
  }
  if (copyChanged) {
    copy = Object.keys(nextCopy).length === 0 ? EMPTY_COPY : nextCopy;
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

function parseCopyRecord(value: unknown): Record<string, string> | null {
  if (!isPlainObject(value)) return null;
  const copyRecord: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") return null;
    copyRecord[key] = entry;
  }
  return copyRecord;
}

function trackingConfigurationFrom(value: unknown): ContentAbTestTrackingConfiguration | undefined {
  if (!isPlainObject(value)) return undefined;
  const trackingConfiguration: ContentAbTestTrackingConfiguration = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") return undefined;
    trackingConfiguration[key] = entry;
  }
  return Object.keys(trackingConfiguration).length > 0 ? trackingConfiguration : undefined;
}

function firebaseKeyToContentAbTestId(key: string): string | null {
  const lower = key.toLowerCase();
  if (!lower.startsWith(FIREBASE_COPY_PREFIX)) return null;
  const id = lower
    .slice(FIREBASE_COPY_PREFIX.length)
    .replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
  return id.length > 0 ? id : null;
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
  if (current.enabled !== next?.enabled) return false;
  if (!isSameCopy(current.copy, next.copy)) return false;
  return isSameTrackingConfiguration(current.trackingConfiguration, next.trackingConfiguration);
}

function isSameTrackingConfiguration(
  current: ContentAbTestTrackingConfiguration | undefined,
  next: ContentAbTestTrackingConfiguration | undefined,
): boolean {
  if (!current && !next) return true;
  if (!current || !next) return false;
  return isSameCopy(current, next);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEnglish(language: string): boolean {
  return language === ENGLISH_LANGUAGE || language.startsWith(`${ENGLISH_LANGUAGE}-`);
}

function cloneTranslationTree(value: object): object {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isTranslationTree(entry) ? cloneTranslationTree(entry) : entry,
    ]),
  );
}

function getTranslationValue(baseline: object, key: string): string | undefined {
  let value: unknown = baseline;
  for (const segment of key.split(".")) {
    if (!isTranslationTree(value) || !Object.hasOwn(value, segment)) return undefined;
    value = value[segment];
  }
  return typeof value === "string" ? value : undefined;
}

function isTranslationTree(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
