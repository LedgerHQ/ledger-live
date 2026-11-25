import { useCallback, useEffect, useMemo, useState } from "react";
import { track, trackPage } from "@shared/analytics";
import { RECEIVE_HELP_QUESTIONS, type ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { RECEIVE_URLS } from "../../urls";
import { RECEIVE_ADDRESS_PAGE, trackReceiveAddressButton } from "./receiveAddressTracking";
import type { ReceiveHelpCardView, ReceiveHelpPanelView } from "./ReceiveAddressView.types";

type Params = Readonly<{
  copy: ReceiveAddressCopy;
  onOpenUrl: (url: string) => void;
}>;

export type ReceiveAddressHelp = Readonly<{
  helpCard: ReceiveHelpCardView;
  helpPanel: ReceiveHelpPanelView | undefined;
}>;

export function useReceiveAddressHelp({ copy, onOpenUrl }: Params): ReceiveAddressHelp {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void trackPage({ category: "Receive - Help", props: RECEIVE_ADDRESS_PAGE });
  }, [isOpen]);

  const open = useCallback(() => {
    trackReceiveAddressButton("help");
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const questions = useMemo(
    () =>
      RECEIVE_HELP_QUESTIONS.map(id => ({
        id,
        label: copy.helpQuestions[id],
        onPress: () => {
          track("faq_clicked", { faq: id, ...RECEIVE_ADDRESS_PAGE });
          onOpenUrl(RECEIVE_URLS[id]);
        },
      })),
    [copy.helpQuestions, onOpenUrl],
  );

  return useMemo(
    () => ({
      helpCard: { title: copy.helpCardTitle, onPress: open },
      helpPanel: isOpen ? { title: copy.helpTitle, questions, onClose: close } : undefined,
    }),
    [copy.helpCardTitle, copy.helpTitle, open, isOpen, questions, close],
  );
}
