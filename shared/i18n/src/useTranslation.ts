import type { KeyPrefix } from "i18next";
import {
  useTranslation as useReactI18nextTranslation,
  type FallbackNs,
  type UseTranslationOptions,
  type UseTranslationResponse,
} from "react-i18next";
import { useI18n } from "./context";
import type { I18nNamespace } from "./types";

/**
 * `react-i18next`'s `useTranslation`, bound to the instance injected at the app root instead of
 * the global singleton. `i18n` is not accepted in the options: the provider decides which engine
 * resolves the keys.
 */
export function useTranslation<
  const Ns extends I18nNamespace | undefined = undefined,
  const KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
>(
  ns?: Ns,
  options?: Omit<UseTranslationOptions<KPrefix>, "i18n">,
): UseTranslationResponse<FallbackNs<Ns>, KPrefix> {
  return useReactI18nextTranslation(ns, { ...options, i18n: useI18n() });
}
