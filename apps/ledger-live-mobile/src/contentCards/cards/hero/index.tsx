import { Button, Flex } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import { Image, Subtitle, Tag } from "./elements";

type Props = {
  description: string;
  image: string;
  cta: {
    label: string;
    fct: Function;
  };
  tag?: string;
};

const HeroCard = ContentCardBuilder<Props>(({ description, image, cta, tag, metadata }) => {
  useEffect(() => metadata.actions?.onView?.());

  return (
    <TouchableOpacity onPress={metadata.actions?.onClick} key={metadata.id}>
      <Flex alignItems="start" rowGap={16} position="relative">
        <Image uri={image} />
        {tag && <Tag label={tag} />}
        <Subtitle label={description} />
        <Button type="main">{cta.label}</Button>
      </Flex>
    </TouchableOpacity>
  );
});

export default HeroCard;
