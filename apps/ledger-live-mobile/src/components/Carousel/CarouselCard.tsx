import React, { memo, useCallback } from "react";
import { Linking } from "react-native";
import { Flex, FullBackgroundCard } from "@ledgerhq/native-ui";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { MediaCard, MediaCardTitle, Tag } from "@ledgerhq/lumen-ui-rnative";
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
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("mobile");
  const { logClickCard, dismissCard, trackContentCardEvent } = useDynamicContent();

  const onPress = useCallback(async () => {
    if (!cardProps) return;
    if (!cardProps.link) return;

    await trackContentCardEvent("contentcard_clicked", {
      ...cardProps.extras,
      screen: cardProps.location,
      campaign: cardProps.id,
    });

    // Notify Braze that the card has been clicked by the user
    logClickCard(cardProps.id);
    await Linking.openURL(cardProps.link);
  }, [cardProps, logClickCard, trackContentCardEvent]);

  const onHide = useCallback(() => {
    if (!cardProps) return;

    trackContentCardEvent("contentcard_dismissed", {
      ...cardProps.extras,
      screen: cardProps.location,
      campaign: cardProps.id,
    });
    dismissCard(cardProps.id);
  }, [cardProps, trackContentCardEvent, dismissCard]);

  if (shouldDisplayBrazePlacement) {
    return (
      <Flex key={`container_${id}`} mr={6} ml={index === 0 ? 6 : 0} width={width}>
        <MediaCard
          imageUrl={cardProps.image ?? ""}
          onPress={cardProps.link ? onPress : undefined}
          onClose={onHide}
        >
          {cardProps.tag ? <Tag label={cardProps.tag} size="md" /> : null}
          {cardProps.title ? <MediaCardTitle>{cardProps.title}</MediaCardTitle> : null}
        </MediaCard>
      </Flex>
    );
  }

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
