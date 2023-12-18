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
} from "~/contentCards/cards/vertical/elements";
import { Size } from "~/contentCards/cards/vertical/types";

type Props = {
  title: string;
  description: string;
  image: string;
  price: string;
  size: Size;
  tag?: string;
};

const VerticalCard = ContentCardBuilder<Props>(
  ({ title, description: subtitle, price, image, tag, size, metadata }) => {
    useEffect(() => metadata.actions?.onView?.());

    return (
      <TouchableOpacity onPress={metadata.actions?.onClick}>
        {tag && <Tag size={size} label={tag} />}
        {metadata.actions?.onDismiss && <Close onPress={metadata.actions?.onDismiss} />}

        <Container size={size}>
          <Image uri={image} />

          <Flex alignItems="center">
            <Title size={size} label={title} />
            <Subtitle size={size} label={subtitle} />
            <Price size={size} label={price} />
          </Flex>
        </Container>
      </TouchableOpacity>
    );
  },
);

export default VerticalCard;
