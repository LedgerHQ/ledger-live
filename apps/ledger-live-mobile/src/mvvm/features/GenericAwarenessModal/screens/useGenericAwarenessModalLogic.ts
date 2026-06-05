import { useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  isGenericAwarenessModalContentCardReady,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";

const GENERIC_AWARENESS_MODAL_APP_START_ID_PREFIX = "app_start";

type GenericAwarenessModalLogicInput = Readonly<{
  campaignId?: string;
  cards: GenericAwarenessModalContentCard[];
}>;

type GenericAwarenessModalLogicContext = Readonly<{
  enabled: boolean;
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
    return cards.find(
      card => card.id === campaignId && isGenericAwarenessModalContentCardReady(card),
    );
  }

  return cards.find(
    card => isGenericAwarenessModalAppStartId(card.id) && isGenericAwarenessModalContentCardReady(card),
  );
}

export function useGenericAwarenessModalLogic(
  { campaignId, cards }: GenericAwarenessModalLogicInput,
  { enabled, isOpen, open }: GenericAwarenessModalLogicContext,
) {
  const cardToOpen = useMemo(
    () => getGenericAwarenessModalCardToOpen({ campaignId, cards }),
    [campaignId, cards],
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled || isOpen || !cardToOpen) return;

      open(cardToOpen.id);
    }, [cardToOpen, enabled, isOpen, open]),
  );

  return {
    shouldMarkAsRead: cardToOpen ? isGenericAwarenessModalAppStartId(cardToOpen.id) : false,
  };
}
