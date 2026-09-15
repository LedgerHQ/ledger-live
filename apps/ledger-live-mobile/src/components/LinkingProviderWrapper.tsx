import React, { useMemo, type ReactNode } from "react";
import { Linking } from "react-native";
import { useSelector } from "~/context/hooks";
import {
  LinkingProvider,
  LEDGER_URL_LANGUAGES,
  DEFAULT_LANGUAGE,
  type LinkingConfig,
} from "@shared/platform-linking";
import { track } from "~/analytics/segment";
import { languageSelector } from "~/reducers/settings";

export function LinkingProviderWrapper({
  children,
}: Readonly<{ children: ReactNode }>): React.JSX.Element {
  const currentLanguage = useSelector(languageSelector);

  const config = useMemo<LinkingConfig>(
    () => ({
      openExternal: url => {
        Linking.openURL(url);
      },
      onLinkOpened: url => {
        track("OpenURL", { url });
      },
      localization: {
        currentLanguage,
        defaultLanguage: DEFAULT_LANGUAGE,
        languages: LEDGER_URL_LANGUAGES,
      },
    }),
    [currentLanguage],
  );

  return <LinkingProvider config={config}>{children}</LinkingProvider>;
}
