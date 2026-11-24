import { useEffect, useMemo } from "react";
import { trackPage } from "@shared/analytics";
import type { ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { canVerifyOnDevice } from "../../logic/canVerifyOnDevice";
import type { ReceiveAddressOption } from "../../logic/toReceiveAddressOptions";
import { toReceiveNotices } from "../../logic/toReceiveNotices";
import type { ReceiveFamilyConfig, ReceiveServiceIncident } from "../../types";
import {
  RECEIVE_ADDRESS_PAGE,
  SERVICE_WARNING_PAGE,
  trackReceiveAddressButton,
} from "./receiveAddressTracking";
import type { ReceiveNoticeView, ReceiveServiceWarningView } from "./ReceiveAddressView.types";

const SERVICE_WARNING_CTA_BUTTON = "service incident details";

type Params = Readonly<{
  familyConfig: ReceiveFamilyConfig | undefined;
  selected: ReceiveAddressOption | undefined;
  serviceIncidents: readonly ReceiveServiceIncident[] | undefined;
  copy: ReceiveAddressCopy;
  onOpenUrl: ((url: string) => void) | undefined;
  openServiceStatus: () => void;
}>;

export type ReceiveAddressNotices = Readonly<{
  notices: readonly ReceiveNoticeView[];
  serviceWarning: ReceiveServiceWarningView | undefined;
}>;

export function useReceiveAddressNotices({
  familyConfig,
  selected,
  serviceIncidents = [],
  copy,
  onOpenUrl,
  openServiceStatus,
}: Params): ReceiveAddressNotices {
  const incidentTitle = serviceIncidents[0]?.title;
  // The notices zone is hidden until the address shows.
  const isWarningShown = selected !== undefined && incidentTitle !== undefined;
  const familyNotices = familyConfig?.notices;

  useEffect(() => {
    if (!isWarningShown) return;
    void trackPage({
      category: SERVICE_WARNING_PAGE,
      props: { warning: "service incident", ...RECEIVE_ADDRESS_PAGE },
    });
  }, [isWarningShown]);

  const notices = useMemo(
    () =>
      selected
        ? toReceiveNotices({
            familyNotices: familyNotices ?? [],
            canVerifyOnDevice: canVerifyOnDevice(selected.verification),
          }).map(({ id, tone, learnMoreUrl }) => ({
            id,
            tone,
            text: copy.noticeTexts[id],
            learnMore:
              learnMoreUrl && onOpenUrl
                ? { label: copy.learnMoreLabel, onPress: () => onOpenUrl(learnMoreUrl) }
                : undefined,
          }))
        : [],
    [selected, familyNotices, copy, onOpenUrl],
  );

  const serviceWarning = useMemo(
    () =>
      !isWarningShown
        ? undefined
        : {
            title: incidentTitle,
            ctaLabel: copy.serviceWarningCta,
            onPress: () => {
              trackReceiveAddressButton(SERVICE_WARNING_CTA_BUTTON);
              openServiceStatus();
            },
          },
    [isWarningShown, incidentTitle, copy.serviceWarningCta, openServiceStatus],
  );

  return { notices, serviceWarning };
}
