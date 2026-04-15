import { useCallback, useMemo } from "react";
import { Linking } from "react-native";

import type { WalletContentCard } from "~/dynamicContent/types";

export type WalletCarouselMediaHeader =
  | { kind: "picto"; ledgerId: string }
  | { kind: "tag"; label: string }
  | null;

type TrackContentCardEvent = (
  event: "contentcard_clicked" | "contentcard_dismissed",
  params: Record<string, string | number | undefined>,
) => Promise<void>;

type Args = {
  cardProps: WalletContentCard;
  logClickCard: (cardId: string) => void;
  dismissCard: (cardId: string) => void;
  trackContentCardEvent: TrackContentCardEvent;
};

export function useCarouselCardModel({
  cardProps,
  logClickCard,
  dismissCard,
  trackContentCardEvent,
}: Args) {
  const handlePress = useCallback(async () => {
    if (!cardProps.link) return;

    await trackContentCardEvent("contentcard_clicked", {
      ...cardProps.extras,
      screen: cardProps.location,
      campaign: cardProps.id,
    });

    logClickCard(cardProps.id);
    await Linking.openURL(cardProps.link);
  }, [cardProps, logClickCard, trackContentCardEvent]);

  const handleHide = useCallback(() => {
    trackContentCardEvent("contentcard_dismissed", {
      ...cardProps.extras,
      screen: cardProps.location,
      campaign: cardProps.id,
    });
    dismissCard(cardProps.id);
  }, [cardProps, dismissCard, trackContentCardEvent]);

  const mediaHeader = useMemo((): WalletCarouselMediaHeader => {
    if (cardProps.picto != null && cardProps.picto !== "") {
      return { kind: "picto", ledgerId: cardProps.picto };
    }
    if (cardProps.tag) {
      return { kind: "tag", label: cardProps.tag };
    }
    return null;
  }, [cardProps.picto, cardProps.tag]);

  return {
    handleHide,
    handlePress,
    mediaHeader,
  };
}
