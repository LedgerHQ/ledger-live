import { useCallback, useMemo } from "react";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { useSecuritySettingsLabels } from "./copy/useSecuritySettingsLabels";
import { getSecurityRows } from "./logic/securityRows";
import { SECURITY_PLATFORM } from "./platform";
import type { SecurityProps, SecurityViewProps } from "./Security.types";
import { toSecurityRowViewProps } from "./securityRowViewProps";
import { getSecurityStateEvents } from "./tracking";
import { SECURITY_URLS } from "./urls";
import { useSecuritySettingsPort } from "./useSecuritySettingsPort";

export function useSecurityViewModel({ testID }: SecurityProps): SecurityViewProps {
  const port = useSecuritySettingsPort();
  const { values } = port;
  const labels = useSecuritySettingsLabels(values.biometricKind);
  const openLink = useOpenLink();
  const mevProtectionUrl = useLocalizedUrl(SECURITY_URLS.mevProtection);
  const openMevProtectionInfo = useCallback(
    () => openLink(mevProtectionUrl),
    [openLink, mevProtectionUrl],
  );

  const rows = useMemo(
    () =>
      getSecurityRows(values, SECURITY_PLATFORM).map(row =>
        toSecurityRowViewProps(row, port, labels, openMevProtectionInfo),
      ),
    [values, port, labels, openMevProtectionInfo],
  );
  const { passwordSet, mevProtection } = values;
  const stateEvents = useMemo(
    () => getSecurityStateEvents({ passwordSet, mevProtection }, SECURITY_PLATFORM),
    [passwordSet, mevProtection],
  );

  return { rows, stateEvents, testID };
}
