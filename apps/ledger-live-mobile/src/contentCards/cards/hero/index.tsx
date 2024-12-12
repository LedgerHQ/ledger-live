import { Button, Flex } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import { Image, Title, Tag, SecondaryText } from "./elements";

type Props = {
  image: string;
  title?: string;
  cta?: string;
  tag?: string;
  secondaryText?: string;
  centeredText?: boolean;
};

const HeroCard = ContentCardBuilder<Props>(
  ({ title, image, secondaryText, cta, tag, metadata, centeredText }) => {
    useEffect(() => metadata.actions?.onView?.());

    return (
      <TouchableOpacity onPress={metadata.actions?.onClick} key={metadata.id}>
        <Flex alignItems={centeredText ? "center" : "start"} rowGap={16} position="relative">
          {image && <Image uri={image} />}
          {tag && <Tag label={tag} />}
          {(title || secondaryText) && (
            <Flex alignItems={centeredText ? "center" : "start"}>
              {title && <Title label={title} hasSecondaryText={!!secondaryText} />}
              {secondaryText && <SecondaryText label={secondaryText} />}
            </Flex>
          )}
          {cta && (
            <Flex flexDirection="row">
              <Button onPress={metadata.actions?.onClick} type="main">
                {cta}
              </Button>
            </Flex>
          )}
        </Flex>
      </TouchableOpacity>
    );
  },
);

export default HeroCard;
