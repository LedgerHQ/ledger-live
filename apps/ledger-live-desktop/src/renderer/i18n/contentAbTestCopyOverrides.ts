import {
  getContentAbTestCopy,
  subscribeToContentAbTestCopy,
  type ContentAbTestCopy,
} from "~/firebase/contentAbTestCopy";

const ENGLISH_LANGUAGE = "en";

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
  off(event: "languageChanged", callback: (language: string) => void): void;
  emit(event: "languageChanged", language: string): void;
};

export function installContentAbTestCopyOverrides(
  i18nInstance: TranslationEngine,
  englishBaseline: object,
  namespace: string,
): () => void {
  const baselineSnapshot = cloneTranslationTree(englishBaseline);
  let copyOverrides: ContentAbTestCopy = getContentAbTestCopy();
  let appliedKeys = new Set<string>();
  let isNotifyingCopyUpdate = false;

  const applyCopyOverrides = (language: string) => {
    for (const key of appliedKeys) {
      const baselineValue = getTranslationValue(baselineSnapshot, key);
      if (baselineValue !== undefined) {
        i18nInstance.addResource(ENGLISH_LANGUAGE, namespace, key, baselineValue, { silent: true });
      }
    }
    appliedKeys = new Set();

    if (!isEnglish(language)) return;
    for (const [key, value] of Object.entries(copyOverrides)) {
      if (getTranslationValue(baselineSnapshot, key) === undefined) continue;
      i18nInstance.addResource(ENGLISH_LANGUAGE, namespace, key, value, {
        silent: true,
      });
      appliedKeys.add(key);
    }
  };

  const onLanguageChanged = (language: string) => {
    if (!isNotifyingCopyUpdate) applyCopyOverrides(language);
  };

  i18nInstance.on("languageChanged", onLanguageChanged);
  applyCopyOverrides(i18nInstance.resolvedLanguage ?? i18nInstance.language);

  const unsubscribe = subscribeToContentAbTestCopy(nextCopyOverrides => {
    copyOverrides = nextCopyOverrides;
    const language = i18nInstance.resolvedLanguage ?? i18nInstance.language;
    applyCopyOverrides(language);

    if (isEnglish(language)) {
      isNotifyingCopyUpdate = true;
      try {
        i18nInstance.emit("languageChanged", language);
      } finally {
        isNotifyingCopyUpdate = false;
      }
    }
  });

  return () => {
    unsubscribe();
    i18nInstance.off("languageChanged", onLanguageChanged);
  };
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
