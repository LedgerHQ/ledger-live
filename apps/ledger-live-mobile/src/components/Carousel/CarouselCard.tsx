import React, { memo } from "react";
import { Flex, FullBackgroundCard } from "@ledgerhq/native-ui";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { MediaCard, MediaCardTitle, Tag } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "styled-components/native";
import { WalletContentCard } from "~/dynamicContent/types";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import ForceTheme from "../theme/ForceTheme";

import { renderWalletCarouselMediaTitleChildren } from "./renderWalletCarouselMediaTitleChildren";
import { useCarouselCardModel } from "./useCarouselCardModel";

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

  const { handleHide, handlePress, mediaHeader } = useCarouselCardModel({
    cardProps,
    logClickCard,
    dismissCard,
    trackContentCardEvent,
  });

  const useMediaCardLayout = shouldDisplayBrazePlacement || mediaHeader != null;

  const backgroundImageUrl =
    cardProps.image_background?.trim() || cardProps.image?.trim() || "";

  if (useMediaCardLayout) {
    let header: React.ReactNode = null;
    if (mediaHeader?.kind === "picto") {
      header = (
        <CryptoIcon ledgerId={mediaHeader.ledgerId} ticker={mediaHeader.ledgerId} size={32} />
      );
    } else if (mediaHeader?.kind === "tag") {
      header = <Tag label={mediaHeader.label} size="md" />;
    }

    return (
      <Flex key={`container_${id}`} mr={6} ml={index === 0 ? 6 : 0} width={width}>
        <MediaCard
          imageUrl={backgroundImageUrl}
          onPress={cardProps.link ? handlePress : undefined}
          onClose={handleHide}
        >
          {header}
          {cardProps.title ? (
            <MediaCardTitle>
              {renderWalletCarouselMediaTitleChildren(cardProps.title)}
            </MediaCardTitle>
          ) : null}
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
          onPress={handlePress}
          onDismiss={handleHide}
        />
      </ForceTheme>
    </Flex>
  );
};

export default memo<CarouselCardProps>(CarouselCard);
