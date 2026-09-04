import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE_LOCALE, locales } from "../languages";

/**
 * The app's translation engine.
 *
 * An explicit instance, never the i18next global singleton: it is what lets `@shared/i18n` hand
 * one engine to the DDD packages, and what will let a future module-federation remote own its own
 * without namespaces clobbering each other.
 *
 * This module is a leaf on purpose — it pulls in the locale resources and nothing else — so the
 * non-React call sites that need `i18n.t` can import it without dragging in `~/context/Locale`
 * and its settings/storage graph.
 */
const i18n = createInstance();

i18n.use(initReactI18next).init({
  fallbackLng: DEFAULT_LANGUAGE_LOCALE,
  resources: locales,
  supportedLngs: Object.keys(locales),
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false, // not needed for react as it does escape per default to prevent xss!
  },
});

export default i18n;
