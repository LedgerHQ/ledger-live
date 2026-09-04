import React, { useState } from "react";
import { I18nProvider } from "../I18nProvider";
import {
  createI18nTestInstance,
  type CreateI18nTestInstanceOptions,
} from "./createI18nTestInstance";

export type I18nTestProviderProps = CreateI18nTestInstanceOptions &
  Readonly<{ children: React.ReactNode }>;

/**
 * Test-only `I18nProvider` that builds its own instance. Wrap a `features/*` component under test
 * with it instead of hand-rolling an i18next setup in every package.
 *
 * The instance is created once per mount and kept in state, not memoised: it is the context value,
 * and callers pass `resources` as an inline literal, so a `useMemo` keyed on it would hand out a
 * fresh instance on every parent re-render and drop whatever the test had applied to the old one.
 */
export function I18nTestProvider({
  children,
  resources,
  language,
  defaultNS,
}: I18nTestProviderProps) {
  const [i18n] = useState(() => createI18nTestInstance({ resources, language, defaultNS }));

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
