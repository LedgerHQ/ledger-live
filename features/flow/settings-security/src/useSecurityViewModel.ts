import { useMemo } from "react";
import { useSecuritySettingsLabels } from "./copy/useSecuritySettingsLabels";
import { getSecurityRows } from "./logic/securityRows";
import { SECURITY_PLATFORM } from "./platform";
import type { SecurityProps, SecurityViewProps } from "./Security.types";
import { toSecurityRowViewProps } from "./securityRowViewProps";
import { getSecurityStateEvents } from "./tracking";
import { useSecuritySettingsPort } from "./useSecuritySettingsPort";

export function useSecurityViewModel({ testID }: SecurityProps): SecurityViewProps {
  const port = useSecuritySettingsPort();
  const { values } = port;
  const labels = useSecuritySettingsLabels(values.biometricKind);

  const rows = useMemo(
    () =>
      getSecurityRows(values, SECURITY_PLATFORM).map(row =>
        toSecurityRowViewProps(row, port, labels),
      ),
    [values, port, labels],
  );
  const { passwordSet, mevProtection } = values;
  const stateEvents = useMemo(
    () => getSecurityStateEvents({ passwordSet, mevProtection }),
    [passwordSet, mevProtection],
  );

  return { rows, stateEvents, testID };
}
