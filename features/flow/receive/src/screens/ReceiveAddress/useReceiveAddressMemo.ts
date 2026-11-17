import { useCallback, useEffect } from "react";
import { trackPage } from "@shared/analytics";
import type { ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import type { ReceiveAddressOption } from "../../logic/toReceiveAddressOptions";
import { RECEIVE_URLS } from "../../urls";
import { RECEIVE_ADDRESS_PAGE, trackReceiveAddressButton } from "./receiveAddressTracking";
import type { ReceiveMemoCardView, ReceiveMemoPanelView } from "./ReceiveAddressView.types";

type Params = Readonly<{
  /** Absent until the address is shown. */
  selected: ReceiveAddressOption | undefined;
  isOpen: boolean;
  copy: ReceiveAddressCopy;
  onOpenUrl: ((url: string) => void) | undefined;
  open: () => void;
  close: () => void;
}>;

export type ReceiveAddressMemo = Readonly<{
  memoCard: ReceiveMemoCardView | undefined;
  memoPanel: ReceiveMemoPanelView | undefined;
}>;

/**
 * "Need a Tag/Memo?" when senders can attach a memo to the address shown: exchanges may need one.
 * Its panel says so, the same for every asset.
 */
export function useReceiveAddressMemo({
  selected,
  isOpen,
  copy,
  onOpenUrl,
  open,
  close,
}: Params): ReceiveAddressMemo {
  const hasMemo = !!selected?.memo;

  useEffect(() => {
    if (!isOpen) return;
    void trackPage({ category: "Receive - Need Memo", props: RECEIVE_ADDRESS_PAGE });
  }, [isOpen]);

  const openMemo = useCallback(() => {
    trackReceiveAddressButton("memo tag info");
    open();
  }, [open]);

  return {
    memoCard: hasMemo ? { title: copy.memoTitle, onPress: openMemo } : undefined,
    memoPanel:
      hasMemo && isOpen
        ? {
            title: copy.memoTitle,
            description: copy.memoDescription,
            gotItLabel: copy.gotItLabel,
            learnMore: onOpenUrl
              ? { label: copy.learnMoreLabel, onPress: () => onOpenUrl(RECEIVE_URLS.memoTag) }
              : undefined,
            onClose: close,
          }
        : undefined,
  };
}
