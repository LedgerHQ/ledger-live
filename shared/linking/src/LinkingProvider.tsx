import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { LinkingConfig, OpenLink } from "./types";
import { assertSafeUrl } from "./assertSafeUrl";
import { localizeUrl } from "./localizeUrl";
import { redactUrl } from "./redactUrl";

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

export function useOpenLink(): OpenLink {
  const config = useContext(LinkingContext);
  if (!config) {
    throw new Error("useOpenLink must be used within a <LinkingProvider>");
  }
  const { openExternal, onLinkOpened } = config;

  return useCallback(
    (url, options) => {
      assertSafeUrl(url);
      onLinkOpened?.(options?.sensitive ? redactUrl(url) : url);
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
