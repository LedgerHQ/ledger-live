import React from "react";
import { I18nContext } from "./context";
import type { I18nInstance } from "./types";

export type I18nProviderProps = Readonly<{
  /**
   * The app's translation engine. Must be an explicit `i18next.createInstance()`, never the
   * module-level global singleton — that is what lets each future module-federation remote own
   * its own instance without namespaces clobbering each other.
   */
  i18n: I18nInstance;
  children: React.ReactNode;
}>;

/**
 * Mounted once at each app root. Owns no i18next instance and no configuration — it only makes
 * the injected one reachable from `features/*`, `domain/*` and `shared/*` components.
 */
export function I18nProvider({ i18n, children }: I18nProviderProps) {
  return <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>;
}
