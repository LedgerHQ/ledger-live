import React, { memo, useCallback } from "react";
import { Linking } from "react-native";
import { Flex, CardA } from "@ledgerhq/native-ui";
import { WalletContentCard } from "../../dynamicContent/types";

type CarouselCardProps = {
  id: string;
  width: number;
  cardProps: WalletContentCard;
  index?: number;
};

const CarouselCard = ({ id, cardProps, index, width }: CarouselCardProps) => {
  const onPress = useCallback(() => {
    cardProps.link && Linking.openURL(cardProps.link);
  }, [cardProps.link]);

  const onHide = useCallback(() => {
    console.log("ON HIDE", id);
  }, []);

  return (
    <Flex key={`container_${id}`} mr={6} ml={index === 0 ? 6 : 0} width={width}>
      <CardA
        variant={cardProps.background}
        backgroundImage={cardProps.image}
        tag={cardProps.tag}
        description={cardProps.title}
        onPress={onPress}
        onDismiss={onHide}
      />
    </Flex>
  );
};

export default memo<CarouselCardProps>(CarouselCard);
