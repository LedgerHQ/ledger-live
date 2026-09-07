import React from "react";
import { I18nTestProvider } from "@shared/i18n/testing";

type Resources = React.ComponentProps<typeof I18nTestProvider>["resources"];

/**
 * A `renderHook` / `render` wrapper that mounts the shared i18n test provider. With no `resources`
 * every key resolves to itself; pass `resources` to assert copy comes from the provider.
 */
export function i18nWrapper(resources?: Resources) {
  return function I18nWrapper({ children }: { children: React.ReactNode }) {
    return <I18nTestProvider resources={resources}>{children}</I18nTestProvider>;
  };
}
