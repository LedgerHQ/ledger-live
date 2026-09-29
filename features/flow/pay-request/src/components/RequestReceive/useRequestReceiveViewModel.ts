import { useCallback, useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import type {
  RequestReceiveActionId,
  RequestReceiveViewModel,
  RequestReceiveViewModelParams,
} from "../../types";
import { splitAddress } from "../../utils/splitAddress";

const TRACK_BUTTON: Readonly<Record<RequestReceiveActionId, string>> = {
  share: "share",
  copy: "copy",
  save: "save",
  verify: "verify",
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
}: RequestReceiveViewModelParams): RequestReceiveViewModel {
  const { t } = useTranslation();
  const addressParts = useMemo(() => splitAddress(address), [address]);

  const runAction = useCallback(
    (id: RequestReceiveActionId, callback?: (address: string) => void) => {
      if (!callback) {
        return;
      }
      trackButtonClicked({
        button: TRACK_BUTTON[id],
        buttonLocation: "request",
        page,
        flow: "request",
      });
      callback(address);
    },
    [address, page],
  );

  const handleShare = useCallback(() => runAction("share", onShare), [runAction, onShare]);
  const handleCopy = useCallback(() => runAction("copy", onCopy), [runAction, onCopy]);
  const handleSave = useCallback(() => runAction("save", onSave), [runAction, onSave]);
  const handleVerify = useCallback(() => runAction("verify", onVerify), [runAction, onVerify]);

  return {
    title: t("payTab.request.title", { asset: asset.name }),
    networkLabel: t("payTab.request.networkLabel", { network }),
    asset,
    network,
    address,
    addressParts,
    qrPayload: address,
    onShare: handleShare,
    onCopy: handleCopy,
    onSave: handleSave,
    onVerify: handleVerify,
  };
}
