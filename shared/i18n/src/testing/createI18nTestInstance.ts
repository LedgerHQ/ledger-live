import { createInstance, type Resource } from "i18next";
import type { I18nInstance } from "../types";

export type CreateI18nTestInstanceOptions = Readonly<{
  /** i18next resources, e.g. `{ en: { translation: { "a.b": "Hello" } } }`. */
  resources?: Resource;
  /** Language to resolve against. Defaults to `en`. */
  language?: string;
  /** Default namespace. Defaults to `translation`. */
  defaultNS?: string;
}>;

/**
 * A throwaway, synchronously initialised i18next instance for tests. With no resources every key
 * resolves to itself, which is what a `features/*` test usually wants to assert on.
 */
export function createI18nTestInstance({
  resources = {},
  language = "en",
  defaultNS = "translation",
}: CreateI18nTestInstanceOptions = {}): I18nInstance {
  const instance = createInstance();

  // Deliberately not `.use(initReactI18next)`: its `init` calls react-i18next's `setI18n` and
  // `setDefaults`, which are process-global. A throwaway test instance must not become the
  // default every bare `useTranslation()` in the jest process resolves against. The provider
  // hands the instance over explicitly, so nothing here needs the plugin.
  instance.init({
    lng: language,
    fallbackLng: language,
    defaultNS,
    ns: [defaultNS],
    resources,
    // Resolve everything in the current tick so tests never have to await init.
    initImmediate: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  return instance;
}
