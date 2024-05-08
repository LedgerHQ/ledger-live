import { Flex } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import {
  Close,
  Container,
  Image,
  Price,
  Subtitle,
  Tag,
  Title,
  Button,
} from "~/contentCards/cards/vertical/elements";
import { Size } from "~/contentCards/cards/vertical/types";
import { WidthFactor } from "~/contentCards/layouts/types";

type Props = {
  title: string;
  description: string;
  image: string;
  price: string;
  size: Size;
  tag?: string;
  cta?: string;
  filledImage?: boolean;
  widthFactor: WidthFactor;
};

const VerticalCard = ContentCardBuilder<Props>(
  ({
    title,
    description: subtitle,
    price,
    image,
    tag,
    size,
    metadata,
    cta,
    filledImage,
    widthFactor,
  }) => {
    useEffect(() => metadata.actions?.onView?.());
    const hasCta = cta && size === "L";
    const hasPrice = !hasCta && price;

    return (
      <TouchableOpacity onPress={metadata.actions?.onClick}>
        {tag && <Tag size={size} label={tag} />}
        {metadata.actions?.onDismiss && <Close onPress={metadata.actions?.onDismiss} />}
        <Container size={size} widthFactor={widthFactor}>
          <Flex alignItems="center" width={"100%"} height={"100%"}>
            <Image uri={image} size={size} filledImage={filledImage} />
            <Flex alignItems="center" px={6}>
              <Title size={size} label={title} />
              <Subtitle size={size} label={subtitle} />
              {hasPrice && <Price size={size} label={price} />}
              {hasCta && <Button size={size} label={cta} action={metadata.actions?.onClick} />}
            </Flex>
          </Flex>
        </Container>
      </TouchableOpacity>
    );
  },
);

export default VerticalCard;
