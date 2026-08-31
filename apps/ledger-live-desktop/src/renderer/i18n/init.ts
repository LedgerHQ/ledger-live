import { createInstance, type InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import locales, { i18_DEFAULT_NAMESPACE } from ".";
import { DEFAULT_LANGUAGE } from "~/config/languages";

const config: InitOptions = {
  resources: locales,
  lng: DEFAULT_LANGUAGE.id,
  defaultNS: i18_DEFAULT_NAMESPACE,
  fallbackLng: DEFAULT_LANGUAGE.id,
  interpolation: {
    escapeValue: false,
  },
  debug: __DEV__,
  react: {
    useSuspense: false,
  },
};

// An explicit instance, never the i18next global singleton: it is what lets `@shared/i18n` hand
// one engine to the DDD packages, and what will let a future module-federation remote own its own
// without namespaces clobbering each other.
const i18n = createInstance();

i18n.use(initReactI18next).init(config);

// The app instance's `t`, for the non-React call sites that used to import `t` from `i18next`.
// i18next already binds its prototype methods at construction and never reassigns `t`, so this
// follows language changes; `.bind` is a no-op that keeps the call site safe if that ever changes.
export const t = i18n.t.bind(i18n);

export default i18n;
