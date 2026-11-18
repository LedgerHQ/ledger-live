import { useCallback, useEffect, useMemo } from "react";
import { track, trackPage } from "@shared/analytics";
import { RECEIVE_HELP_QUESTIONS, type ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { RECEIVE_URLS } from "../../urls";
import { trackReceiveAddressButton, type ReceiveAddressTracking } from "./receiveAddressTracking";
import type { ReceiveHelpCardView, ReceiveHelpPanelView } from "./ReceiveAddressView.types";

type Params = Readonly<{
  isOpen: boolean;
  copy: ReceiveAddressCopy;
  /** Without it, no help: its questions are links. */
  onOpenUrl: ((url: string) => void) | undefined;
  open: () => void;
  close: () => void;
  tracking: ReceiveAddressTracking;
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
  tracking,
}: Params): ReceiveAddressHelp {
  useEffect(() => {
    if (!isOpen) return;
    void trackPage({ category: "Receive - Help", props: tracking });
  }, [isOpen, tracking]);

  const openHelp = useCallback(() => {
    trackReceiveAddressButton("help", tracking);
    open();
  }, [open, tracking]);

  const questions = useMemo(
    () =>
      onOpenUrl
        ? RECEIVE_HELP_QUESTIONS.map(id => ({
            id,
            label: copy.helpQuestions[id],
            onPress: () => {
              track("faq_clicked", { faq: id, ...tracking });
              onOpenUrl(RECEIVE_URLS[id]);
            },
          }))
        : [],
    [copy.helpQuestions, onOpenUrl, tracking],
  );

  if (!onOpenUrl) return { helpCard: undefined, helpPanel: undefined };
  return {
    helpCard: { title: copy.helpCardTitle, onPress: openHelp },
    helpPanel: isOpen ? { title: copy.helpTitle, questions, onClose: close } : undefined,
  };
}
