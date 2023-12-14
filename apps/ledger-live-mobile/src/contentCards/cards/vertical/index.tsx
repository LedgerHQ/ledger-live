import { Flex } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "styled-components/native";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import { Close, Image, Price, Subtitle, Tag, Title } from "~/contentCards/cards/vertical/elements";
import { Size } from "~/contentCards/cards/vertical/types";

type Props = {
  title: string;
  description: string;
  image: string;
  price: string;
  tag?: string;
  size?: Size;
};

export const SIZES: {
  [key in Size]: {
    height: number;

    paddingTop: number;
    paddingBottom: number;

    radius: number;
  };
} = {
  L: {
    height: 306,

    paddingTop: 24,
    paddingBottom: 24,

    radius: 12,
  },
  M: {
    height: 206,

    paddingTop: 16,
    paddingBottom: 8,

    radius: 16,
  },
  S: {
    height: 156,

    paddingTop: 16,
    paddingBottom: 8,

    radius: 16,
  },
};

const VerticalCard = ContentCardBuilder<Props>(
  ({ title, description: subtitle, price, image, tag, size = "L", metadata }) => {
    const { colors } = useTheme();

    const styles = SIZES[size];

    useEffect(() => metadata.actions?.onView?.());

    return (
      <TouchableOpacity onPress={metadata.actions?.onClick}>
        {tag && <Tag size={size} label={tag} />}
        {metadata.actions?.onDismiss && <Close onPress={metadata.actions?.onDismiss} />}

        <View
          style={{
            position: "relative",
            justifyContent: "space-between",
            alignItems: "center",

            backgroundColor: colors.opacityDefault.c05,
            paddingTop: styles.paddingTop,
            paddingBottom: styles.paddingBottom,
            borderRadius: styles.radius,
            height: styles.height,
          }}
        >
          <Image uri={image} />

          <Flex alignItems="center">
            <Title size={size} label={title} />
            <Subtitle size={size} label={subtitle} />
            <Price size={size} label={price} />
          </Flex>
        </View>
      </TouchableOpacity>
    );
  },
);

export default VerticalCard;
