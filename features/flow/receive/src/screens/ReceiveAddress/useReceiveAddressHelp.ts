import { useCallback, useEffect, useMemo } from "react";
import { track, trackPage } from "@shared/analytics";
import { RECEIVE_HELP_QUESTIONS, type ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { RECEIVE_URLS } from "../../urls";
import { RECEIVE_ADDRESS_PAGE, trackReceiveAddressButton } from "./receiveAddressTracking";
import type { ReceiveHelpCardView, ReceiveHelpPanelView } from "./ReceiveAddressView.types";

type Params = Readonly<{
  isOpen: boolean;
  copy: ReceiveAddressCopy;
  /** Without it, no help: its questions are links. */
  onOpenUrl: ((url: string) => void) | undefined;
  open: () => void;
  close: () => void;
}>;

export type ReceiveAddressHelp = Readonly<{
  helpCard: ReceiveHelpCardView | undefined;
  helpPanel: ReceiveHelpPanelView | undefined;
}>;

/** "Need support? Get help", and its support questions, each opening its article. */
export function useReceiveAddressHelp({
  isOpen,
  copy,
  onOpenUrl,
  open,
  close,
}: Params): ReceiveAddressHelp {
  useEffect(() => {
    if (!isOpen) return;
    void trackPage({ category: "Receive - Help", props: RECEIVE_ADDRESS_PAGE });
  }, [isOpen]);

  const openHelp = useCallback(() => {
    trackReceiveAddressButton("help");
    open();
  }, [open]);

  const questions = useMemo(
    () =>
      onOpenUrl
        ? RECEIVE_HELP_QUESTIONS.map(id => ({
            id,
            label: copy.helpQuestions[id],
            onPress: () => {
              track("faq_clicked", { faq: copy.helpQuestions[id], ...RECEIVE_ADDRESS_PAGE });
              onOpenUrl(RECEIVE_URLS[id]);
            },
          }))
        : [],
    [copy.helpQuestions, onOpenUrl],
  );

  if (!onOpenUrl) return { helpCard: undefined, helpPanel: undefined };
  return {
    helpCard: { title: copy.helpCardTitle, onPress: openHelp },
    helpPanel: isOpen ? { title: copy.helpTitle, questions, onClose: close } : undefined,
  };
}
