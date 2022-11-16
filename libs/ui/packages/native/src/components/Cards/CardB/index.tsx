import React from "react";
import { ArrowRightMedium, CloseMedium } from "@ledgerhq/icons-ui/native";

import { TouchableOpacityProps, TouchableOpacity } from "react-native";
import styled, { useTheme } from "styled-components/native";

import { Text, Flex, Link, rgba } from "@ledgerhq/native-ui";

export type CardProps = TouchableOpacityProps & {
  tag?: string;
  title?: string;
  cta?: string;
  image?: string;
  onPressDismiss?: () => void;
};

export const Base = styled(TouchableOpacity)`
  border-radius: 8px;
`;

export const Container = styled(Flex)`
  background: ${(p) => rgba(p.theme.colors.neutral.c20, 0.4)};
  flex-direction: row;
  border-radius: 8px;
`;

export const ImageContainer = styled(Flex)`
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  position: relative;
`;

export const CloseContainer = styled(TouchableOpacity)`
  background-color: ${(p) => p.theme.colors.neutral.c30};
  position: absolute;
  right: 8px;
  top: 8px;
  border-radius: 50%;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const CloseButton = (props: CardProps) => {
  const { colors } = useTheme();
  return (
    <CloseContainer onPress={props.onPressDismiss}>
      <CloseMedium size={14} color={colors.neutral.c100} />
    </CloseContainer>
  );
};

const CardContainer = (props: CardProps): React.ReactElement => {
  const { tag, title, cta, onPress } = props;

  return (
    <Container height={125} width={"100%"}>
      <Flex justifyContent={"space-between"} alignItems={"flex-start"} p={"12px"} flexShrink={1}>
        <Flex>
          <Text
            variant={"small"}
            fontWeight={"semiBold"}
            color="neutral.c70"
            uppercase
            numberOfLines={1}
          >
            {tag}
          </Text>

          <Text
            variant={"large"}
            numberOfLines={3}
            fontWeight={"semiBold"}
            color="neutral.c100"
            ellipsizeMode="tail"
            mt={"8px"}
          >
            {title}
          </Text>
        </Flex>
        <Link
          type={"main"}
          size={"medium"}
          iconPosition="right"
          Icon={() => <ArrowRightMedium color="primary.c80" />}
          onPress={onPress}
        >
          <Text variant={"paragraph"} fontWeight={"semiBold"} color="primary.c80" numberOfLines={1}>
            {cta}
          </Text>
        </Link>
      </Flex>

      <ImageContainer width={115} backgroundColor="red">
        <CloseButton />
      </ImageContainer>
    </Container>
  );
};

const CardB = (props: CardProps): React.ReactElement => {
  return (
    <Base {...props} activeOpacity={0.5}>
      <CardContainer {...props} />
    </Base>
  );
};

export default CardB;
