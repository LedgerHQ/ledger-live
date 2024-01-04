import React, { memo, useCallback, useEffect } from "react";
import { Linking } from "react-native";
import { Flex, FullBackgroundCard } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { WalletContentCard } from "~/dynamicContent/types";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import ForceTheme from "../theme/ForceTheme";

type CarouselCardProps = {
  id: string;
  width: number;
  cardProps: WalletContentCard;
  index?: number;
};

const CarouselCard = ({ id, cardProps, index, width }: CarouselCardProps) => {
  const { theme } = useTheme();
  const { logClickCard, logImpressionCard, dismissCard, trackContentCardEvent } =
    useDynamicContent();

  useEffect(() => {
    if (cardProps) {
      // Notify Braze that the card has been displayed to the user
      logImpressionCard(cardProps.id);
    }
  }, [cardProps, logImpressionCard]);

  const onPress = useCallback(() => {
    if (!cardProps) return;
    if (!cardProps.link) return;

    trackContentCardEvent("contentcard_clicked", {
      screen: cardProps.location,
      link: cardProps.link,
      campaign: cardProps.id,
    });

    // Notify Braze that the card has been clicked by the user
    logClickCard(cardProps.id);
    Linking.openURL(cardProps.link);
  }, [cardProps, logClickCard, trackContentCardEvent]);

  const onHide = useCallback(() => {
    if (!cardProps) return;

    trackContentCardEvent("contentcard_dismissed", {
      screen: cardProps.location,
      link: cardProps.link || "",
      campaign: cardProps.id,
    });
    dismissCard(cardProps.id);
  }, [cardProps, trackContentCardEvent, dismissCard]);

  return (
    <Flex key={`container_${id}`} mr={6} ml={index === 0 ? 6 : 0} width={width}>
      <ForceTheme selectedPalette={cardProps.image ? "dark" : theme}>
        <FullBackgroundCard
          variant={cardProps.background}
          backgroundImage={cardProps.image}
          tag={cardProps.tag}
          description={cardProps.title}
          onPress={onPress}
          onDismiss={onHide}
        />
      </ForceTheme>
    </Flex>
  );
};

export default memo<CarouselCardProps>(CarouselCard);
