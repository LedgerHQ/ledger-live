import { useCallback, useEffect, useMemo, useState } from "react";
import { trackPage } from "@shared/analytics";
import { isSafeUrl } from "@shared/linking";
import type { ReceiveServiceIncident } from "../../types";
import { RECEIVE_ADDRESS_PAGE, SERVICE_WARNING_PAGE } from "./receiveAddressTracking";
import type { ReceiveServiceStatusView } from "./ReceiveAddressView.types";

type Params = Readonly<{
  serviceIncidents: readonly ReceiveServiceIncident[] | undefined;
  continueLabel: string;
  onOpenUrl: (url: string) => void;
}>;

export function useReceiveAddressServiceStatus({
  serviceIncidents,
  continueLabel,
  onOpenUrl,
}: Params): ReceiveServiceStatusView | undefined {
  const [isDismissed, setIsDismissed] = useState(false);
  const incident = serviceIncidents?.[0];
  const isShown = incident !== undefined && !isDismissed;

  useEffect(() => {
    if (!isShown) return;
    void trackPage({
      category: SERVICE_WARNING_PAGE,
      props: { warning: "service incident", ...RECEIVE_ADDRESS_PAGE },
    });
  }, [isShown]);

  const onContinue = useCallback(() => setIsDismissed(true), []);

  return useMemo(
    () =>
      isShown
        ? {
            title: incident.title,
            description: incident.description?.map(({ text, url }) => ({
              text,
              onPress: url && isSafeUrl(url) ? () => onOpenUrl(url) : undefined,
            })),
            continueLabel,
            onContinue,
          }
        : undefined,
    [isShown, incident, continueLabel, onOpenUrl, onContinue],
  );
}
