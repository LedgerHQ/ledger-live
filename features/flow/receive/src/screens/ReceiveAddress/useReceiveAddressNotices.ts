import { useEffect, useMemo } from "react";
import { trackPage } from "@shared/analytics";
import type { ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { canVerifyOnDevice } from "../../logic/canVerifyOnDevice";
import type { ReceiveAddressOption } from "../../logic/toReceiveAddressOptions";
import { toReceiveNotices } from "../../logic/toReceiveNotices";
import type { ReceiveFamilyConfig, ReceiveServiceIncident } from "../../types";
import { RECEIVE_ADDRESS_PAGE, trackReceiveAddressButton } from "./receiveAddressTracking";
import type { ReceiveNoticeView, ReceiveServiceWarningView } from "./ReceiveAddressView.types";

const SERVICE_WARNING_CTA_BUTTON = "service incident details";

type Params = Readonly<{
  familyConfig: ReceiveFamilyConfig;
  /** Absent until the address is shown: the notices are about it. */
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

/**
 * The banners under the actions, in order: a service incident on the network, the family's
 * notices, then whether the device cannot show the address.
 */
export function useReceiveAddressNotices({
  familyConfig,
  selected,
  serviceIncidents = [],
  copy,
  onOpenUrl,
  openServiceStatus,
}: Params): ReceiveAddressNotices {
  const [incident] = serviceIncidents;

  useEffect(() => {
    if (!incident) return;
    void trackPage({
      category: "Receive - Infra Warning",
      props: { warning: "service incident", ...RECEIVE_ADDRESS_PAGE },
    });
  }, [incident]);

  const notices = useMemo(
    () =>
      selected
        ? toReceiveNotices({
            familyNotices: familyConfig.notices,
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
    [selected, familyConfig.notices, copy, onOpenUrl],
  );

  return {
    notices,
    serviceWarning: incident
      ? {
          title: incident.title,
          ctaLabel: copy.serviceWarningCta,
          onPress: () => {
            trackReceiveAddressButton(SERVICE_WARNING_CTA_BUTTON);
            openServiceStatus();
          },
        }
      : undefined,
  };
}
