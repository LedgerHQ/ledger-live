import { Button, Flex } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import { Image, Title, Tag } from "./elements";

type Props = {
  image: string;
  title: string;
  cta: string;
  tag?: string;
};

const HeroCard = ContentCardBuilder<Props>(({ title, image, cta, tag, metadata }) => {
  useEffect(() => metadata.actions?.onView?.());

  return (
    <TouchableOpacity onPress={metadata.actions?.onClick} key={metadata.id}>
      <Flex alignItems="start" rowGap={16} position="relative">
        <Image uri={image} />
        {tag && <Tag label={tag} />}
        <Title label={title} />
        <Button type="main">{cta}</Button>
      </Flex>
    </TouchableOpacity>
  );
});

export default HeroCard;
