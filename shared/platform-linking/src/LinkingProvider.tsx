import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { LinkingConfig } from "./types";
import { assertSafeUrl } from "./assertSafeUrl";
import { localizeUrl } from "./localizeUrl";

const LinkingContext = createContext<LinkingConfig | null>(null);

export function LinkingProvider({
  children,
  config,
}: Readonly<{
  children: ReactNode;
  config: LinkingConfig;
}>): React.JSX.Element {
  return <LinkingContext.Provider value={config}>{children}</LinkingContext.Provider>;
}

export function useOpenLink(): (url: string) => void {
  const config = useContext(LinkingContext);
  if (!config) {
    throw new Error("useOpenLink must be used within a <LinkingProvider>");
  }
  const { openExternal, onLinkOpened } = config;

  return useCallback(
    (url: string) => {
      assertSafeUrl(url);
      onLinkOpened?.(url);
      Promise.resolve(openExternal(url)).catch(() => {});
    },
    [openExternal, onLinkOpened],
  );
}

export function useLocalizedUrl(url: string): string {
  const config = useContext(LinkingContext);
  return useMemo(
    () => (config?.localization ? localizeUrl(url, config.localization) : url),
    [url, config?.localization],
  );
}
