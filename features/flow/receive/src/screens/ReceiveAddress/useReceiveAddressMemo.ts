import { useCallback, useEffect, useMemo, useState } from "react";
import { trackPage } from "@shared/analytics";
import type { ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import type { ReceiveAddressOption } from "../../logic/toReceiveAddressOptions";
import { RECEIVE_URLS } from "../../urls";
import { RECEIVE_ADDRESS_PAGE, trackReceiveAddressButton } from "./receiveAddressTracking";
import type { ReceiveMemoCardView, ReceiveMemoPanelView } from "./ReceiveAddressView.types";

type Params = Readonly<{
  /** Absent until the address is shown. */
  selected: ReceiveAddressOption | undefined;
  copy: ReceiveAddressCopy;
  onOpenUrl: (url: string) => void;
}>;

export type ReceiveAddressMemo = Readonly<{
  memoCard: ReceiveMemoCardView | undefined;
  memoPanel: ReceiveMemoPanelView | undefined;
}>;

export function useReceiveAddressMemo({ selected, copy, onOpenUrl }: Params): ReceiveAddressMemo {
  const [isOpen, setIsOpen] = useState(false);
  const hasMemo = !!selected?.memo;
  const isShown = hasMemo && isOpen;

  useEffect(() => {
    if (!isShown) return;
    void trackPage({ category: "Receive - Need Memo", props: RECEIVE_ADDRESS_PAGE });
  }, [isShown]);

  const open = useCallback(() => {
    trackReceiveAddressButton("memo tag info");
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  return useMemo(
    () => ({
      memoCard: hasMemo ? { title: copy.memoTitle, onPress: open } : undefined,
      memoPanel: isShown
        ? {
            title: copy.memoTitle,
            description: copy.memoDescription,
            gotItLabel: copy.memoGotIt,
            learnMore: {
              label: copy.learnMoreLabel,
              onPress: () => onOpenUrl(RECEIVE_URLS.memoTag),
            },
            onClose: close,
          }
        : undefined,
    }),
    [hasMemo, isShown, copy, open, close, onOpenUrl],
  );
}
