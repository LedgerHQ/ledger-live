import { useCallback, useMemo } from "react";
import type { RequestReceiveViewModel, RequestReceiveViewModelParams } from "../../types";
import { splitAddress } from "../../utils/splitAddress";

type RequestActionId = "share" | "copy" | "save" | "verify";

// Analytics button names per the Pay Tracking Plan (wording still to confirm with product).
const TRACK_BUTTON: Readonly<Record<RequestActionId, string>> = {
  share: "share",
  copy: "copy address",
  save: "save",
  verify: "verify on device",
};

export function useRequestReceiveViewModel({
  address,
  asset,
  network,
  page,
  onShare,
  onCopy,
  onSave,
  onVerify,
  onTrackEvent,
}: RequestReceiveViewModelParams): RequestReceiveViewModel {
  const addressParts = useMemo(() => splitAddress(address), [address]);

  const runAction = useCallback(
    (id: RequestActionId, callback: (address: string) => void) => {
      onTrackEvent?.("button_clicked", {
        button: TRACK_BUTTON[id],
        buttonLocation: "request",
        page,
      });
      callback(address);
    },
    [address, page, onTrackEvent],
  );

  const handleShare = useCallback(() => runAction("share", onShare), [runAction, onShare]);
  const handleCopy = useCallback(() => runAction("copy", onCopy), [runAction, onCopy]);
  const handleSave = useCallback(() => runAction("save", onSave), [runAction, onSave]);
  const handleVerify = useCallback(() => runAction("verify", onVerify), [runAction, onVerify]);

  return {
    asset,
    network,
    address,
    addressParts,
    // Plain address payload for now; a URI scheme (amount/label) can be layered in later if needed.
    qrPayload: address,
    onShare: handleShare,
    onCopy: handleCopy,
    onSave: handleSave,
    onVerify: handleVerify,
  };
}
