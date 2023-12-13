import { Flex } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { Close, Image, Subtitle, Tag, Title } from "~/contentCards/cards/horizontal/elements";
import { ContentCardBuilder } from "~/contentCards/cards/utils";

type Props = {
  title: string;
  description: string;
  image: string;
  tag?: string;
};

const HorizontalCard = ContentCardBuilder<Props>(({ title, description, image, tag, metadata }) => {
  const { colors, space } = useTheme();

  const isDismissable = !!metadata.actions?.onDismiss;
  const isTag = !!tag;

  useEffect(() => metadata.actions?.onView?.());

  return (
    <TouchableOpacity onPress={metadata.actions?.onClick} key={metadata.id}>
      <Flex
        bg={colors.opacityDefault.c05}
        p="13px"
        borderRadius="12px"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        columnGap={13}
      >
        {image ? <Image uri={image} /> : null}

        <Flex flex={1} rowGap={space[2]}>
          <Flex flexDirection="row" justifyContent="space-between" columnGap={space[3]}>
            <Flex overflow={"hidden"} flex={1}>
              <Title label={title} />
            </Flex>

            <Flex alignSelf="center" height="16px">
              {isDismissable ? (
                <Close onPress={metadata.actions?.onDismiss} />
              ) : (
                isTag && <Tag label={tag} />
              )}
            </Flex>
          </Flex>
          {description ? <Subtitle label={description} /> : null}
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
});

export default HorizontalCard;
