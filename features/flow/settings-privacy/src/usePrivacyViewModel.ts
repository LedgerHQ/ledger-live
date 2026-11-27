import { useCallback, useMemo } from "react";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { usePrivacySettingsLabels } from "./copy/usePrivacySettingsLabels";
import { getPrivacyRowIds } from "./logic/privacyRows";
import { PRIVACY_PLATFORM } from "./platform";
import type { PrivacyProps, PrivacyViewProps } from "./Privacy.types";
import { toPrivacyRowViewProps } from "./privacyRowViewProps";
import { getPrivacyStateEvents, trackPrivacyPolicyOpen } from "./tracking";
import { PRIVACY_URLS } from "./urls";
import { usePrivacySettingsPort } from "./usePrivacySettingsPort";

export function usePrivacyViewModel({ testID }: PrivacyProps): PrivacyViewProps {
  const port = usePrivacySettingsPort();
  const { values } = port;
  const labels = usePrivacySettingsLabels();
  const openLink = useOpenLink();
  const privacyPolicyUrl = useLocalizedUrl(PRIVACY_URLS.privacyPolicy[PRIVACY_PLATFORM]);
  const openPrivacyPolicy = useCallback(() => {
    trackPrivacyPolicyOpen(PRIVACY_PLATFORM);
    openLink(privacyPolicyUrl);
  }, [openLink, privacyPolicyUrl]);

  const rows = useMemo(
    () =>
      getPrivacyRowIds(values).map(id =>
        toPrivacyRowViewProps(id, {
          port,
          labels,
          platform: PRIVACY_PLATFORM,
          openPrivacyPolicy,
        }),
      ),
    [values, port, labels, openPrivacyPolicy],
  );
  const stateEvents = useMemo(() => getPrivacyStateEvents(values, PRIVACY_PLATFORM), [values]);

  return { rows, stateEvents, testID };
}
