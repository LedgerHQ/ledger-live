import { useEffect, useMemo } from "react";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";

const GENERIC_AWARENESS_MODAL_APP_START_ID_PREFIX = "app_start";

type GenericAwarenessModalLogicInput = Readonly<{
  campaignId?: string;
  cards: GenericAwarenessModalContentCard[];
}>;

type GenericAwarenessModalLogicContext = Readonly<{
  enabled: boolean;
  isFocused: boolean;
  isOpen: boolean;
  open: (campaignId: string) => void;
}>;

export function isGenericAwarenessModalAppStartId(id: string): boolean {
  return id.toLowerCase().startsWith(GENERIC_AWARENESS_MODAL_APP_START_ID_PREFIX);
}

export function getGenericAwarenessModalCardToOpen({
  campaignId,
  cards,
}: GenericAwarenessModalLogicInput): GenericAwarenessModalContentCard | undefined {
  if (campaignId) {
    return cards.find(card => card.id === campaignId);
  }

  return cards.find(card => isGenericAwarenessModalAppStartId(card.id));
}

export function useGenericAwarenessModalLogic(
  { campaignId, cards }: GenericAwarenessModalLogicInput,
  { enabled, isFocused, isOpen, open }: GenericAwarenessModalLogicContext,
) {
  const cardToOpen = useMemo(
    () => getGenericAwarenessModalCardToOpen({ campaignId, cards }),
    [campaignId, cards],
  );

  useEffect(() => {
    if (!enabled || !isFocused || isOpen || !cardToOpen) return;

    open(cardToOpen.id);
  }, [cardToOpen, enabled, isFocused, isOpen, open]);

  return {
    shouldMarkAsRead: cardToOpen ? isGenericAwarenessModalAppStartId(cardToOpen.id) : false,
  };
}
