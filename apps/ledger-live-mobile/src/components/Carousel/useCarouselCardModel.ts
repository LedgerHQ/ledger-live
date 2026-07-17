import { useCallback, useMemo } from "react";
import { Linking } from "react-native";

import {
  buildContentCardTrackingProperties,
  ContentCardEvent,
  type ContentCardEventProperties,
  type ContentCardInteractionEvent,
} from "@ledgerhq/live-common/braze/contentCardExtras";
import type { WalletContentCard } from "~/dynamicContent/types";

export type WalletCarouselMediaHeader =
  | { kind: "picto"; ledgerId: string }
  | { kind: "tag"; label: string }
  | null;

type TrackContentCardEvent = (
  event: ContentCardInteractionEvent,
  params: ContentCardEventProperties,
) => Promise<void>;

type Args = {
  cardProps: WalletContentCard;
  displayedPosition: number;
  logClickCard: (cardId: string) => void;
  dismissCard: (cardId: string) => void;
  trackContentCardEvent: TrackContentCardEvent;
};

export function useCarouselCardModel({
  cardProps,
  displayedPosition,
  logClickCard,
  dismissCard,
  trackContentCardEvent,
}: Args) {
  const trackingBase = useMemo(
    () => ({
      ...buildContentCardTrackingProperties({
        cardExtras: cardProps.extras,
        categoryLocation: cardProps.location,
      }),
      screen: cardProps.location,
      campaign: cardProps.id,
    }),
    [cardProps.extras, cardProps.id, cardProps.location],
  );

  const handlePress = useCallback(async () => {
    if (!cardProps.link) return;

    await trackContentCardEvent(ContentCardEvent.Clicked, {
      ...trackingBase,
      displayedPosition,
    });

    logClickCard(cardProps.id);
    await Linking.openURL(cardProps.link);
  }, [
    cardProps.id,
    cardProps.link,
    displayedPosition,
    logClickCard,
    trackContentCardEvent,
    trackingBase,
  ]);

  const handleHide = useCallback(() => {
    trackContentCardEvent(ContentCardEvent.Dismissed, {
      ...trackingBase,
      displayedPosition,
    });
    dismissCard(cardProps.id);
  }, [cardProps.id, dismissCard, displayedPosition, trackContentCardEvent, trackingBase]);

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
