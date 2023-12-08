import { Flex } from "@ledgerhq/native-ui";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { Close, Image, Subtitle, Tag, Title } from "~/contentCards/cards/horizontal/elements";

type Props = {
  id: string;
  title: string;
  description: string;
  image: string;
  tag?: string;
  onDismiss?: () => void;
  onClick?: () => void;
};

const HorizontalCard = ({ id, title, description, image, tag, onDismiss, onClick }: Props) => {
  const { colors, space } = useTheme();

  const isDismissable = !!onDismiss;
  const isTag = !!tag;

  return (
    <TouchableOpacity onPress={onClick} key={id}>
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
              {isDismissable ? <Close onPress={onDismiss} /> : isTag && <Tag label={tag} />}
            </Flex>
          </Flex>
          {description ? <Subtitle label={description} /> : null}
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
};

export default HorizontalCard;
