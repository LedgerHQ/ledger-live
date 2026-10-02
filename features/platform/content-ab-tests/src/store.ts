import type { RemoteConfigValue } from "@features/platform-feature-flags-firebase";
import {
  enabledContentAbTestCopy,
  enabledContentAbTestTracking,
  parseContentAbTestPayload,
  parseContentAbTests,
  type ContentAbTestCopy,
  type ContentAbTestPayload,
  type ContentAbTests,
  type ContentAbTestTracking,
} from "./internals/parse";

export { parseContentAbTestPayload };
export type {
  ContentAbTestCopy,
  ContentAbTestPayload,
  ContentAbTests,
  ContentAbTestTracking,
} from "./internals/parse";

export type ContentAbTestTrackingConfiguration = Record<string, string>;

type CopySubscriber = (copy: ContentAbTestCopy) => void;
type ExperimentsSubscriber = (experiments: ContentAbTests) => void;

const EMPTY_COPY: ContentAbTestCopy = Object.freeze({});
const EMPTY_EXPERIMENTS: ContentAbTests = Object.freeze({});
const EMPTY_TRACKING: ContentAbTestTracking = Object.freeze({});
const ENGLISH_LANGUAGE = "en";

let remote: ContentAbTests = EMPTY_EXPERIMENTS;
let overrides: Record<string, ContentAbTestPayload> = {};
let experiments: ContentAbTests = EMPTY_EXPERIMENTS;
let copy: ContentAbTestCopy = EMPTY_COPY;
let tracking: ContentAbTestTracking | undefined;
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

/** Every valid experiment, enabled or not, with local debug overrides applied. */
export function getContentAbTests(): ContentAbTests {
  return experiments;
}

/**
 * The `trackingConfiguration` of each enabled experiment, sent as `ab_tests`. `{}` when the
 * language is not English, or when no enabled experiment has tracking pairs, so callers can send
 * that value and the next identify replaces a stale user trait. Copy is English-only, so a
 * non-English session must not be counted in the experiment.
 */
export function getContentAbTestTracking(language: string): ContentAbTestTracking {
  if (!isEnglish(language) || !tracking) return EMPTY_TRACKING;
  return tracking;
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
 * Only enabled experiments apply copy and reach `getContentAbTestTracking`. A malformed payload,
 * including a non-string tracking value, is dropped entirely. Local debug overrides survive a
 * later poll and replace the remote payload while they are set.
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

function publish(): ContentAbTestCopy {
  const nextExperiments: ContentAbTests = Object.freeze({ ...remote, ...overrides });
  const nextCopy = enabledContentAbTestCopy(nextExperiments);
  const nextTracking = enabledContentAbTestTracking(nextExperiments);
  tracking = Object.keys(nextTracking).length > 0 ? nextTracking : undefined;

  const experimentsChanged = !isSameExperiments(experiments, nextExperiments);
  const copyChanged = !isSameCopy(copy, nextCopy);

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
