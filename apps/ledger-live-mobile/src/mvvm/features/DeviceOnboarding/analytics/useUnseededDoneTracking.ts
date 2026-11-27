import { useCallback, useRef, useState } from "react";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { FirmwareCheck } from "@features/platform-device-onboarding";
import { trackUnseededDone } from "@features/platform-device-onboarding-analytics";
import { useSelector } from "~/context/hooks";
import type { UnseededFunnel } from "./useUnseededFunnelTracking";

type Input = Readonly<{
  funnel: UnseededFunnel | null;
  firmwareKind: FirmwareCheck["kind"] | null;
}>;

/** An offered update, then an up-to-date check: the machine forgets the check after the update. */
function useFirmwareUpdateDone(funnel: UnseededFunnel | null, firmwareKind: Input["firmwareKind"]) {
  const updatedNow =
    funnel?.status.firmwareUpdateAvailability === "yes" && firmwareKind === "upToDate";
  const [updated, setUpdated] = useState(updatedNow);
  if (updatedNow && !updated) setUpdated(true);
  return updated || updatedNow;
}

/** Returns a callback that sends `onboarding_done` once per run of the unseeded funnel. */
export function useUnseededDoneTracking({ funnel, firmwareKind }: Input): () => void {
  const hasTrustchain = Boolean(useSelector(trustchainSelector)?.rootId);
  const firmwareUpdateDone = useFirmwareUpdateDone(funnel, firmwareKind);
  const sent = useRef(false);

  return useCallback(() => {
    if (!funnel || sent.current) return;
    sent.current = true;
    trackUnseededDone(funnel.props, funnel.status, {
      ledgerSyncDone: funnel.status.ledgerSyncEligible && hasTrustchain,
      firmwareUpdateDone,
    });
  }, [firmwareUpdateDone, funnel, hasTrustchain]);
}
