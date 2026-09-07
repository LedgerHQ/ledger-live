import { createContext, useContext } from "react";
import { MissingI18nProviderError } from "./errors";
import type { I18nInstance } from "./types";

export const I18nContext = createContext<I18nInstance | null>(null);

/**
 * The i18n instance mounted at the app root. Use it for what the `t` function does not cover —
 * the current language, `changeLanguage`, `exists`. For translating, prefer `useTranslation`.
 *
 * Throws when no provider is mounted: a missing provider silently falling back to the i18next
 * global singleton is exactly the namespace-clobbering failure this package exists to prevent.
 */
export function useI18n(): I18nInstance {
  const i18n = useContext(I18nContext);
  if (i18n === null) throw new MissingI18nProviderError("useI18n");
  return i18n;
}
