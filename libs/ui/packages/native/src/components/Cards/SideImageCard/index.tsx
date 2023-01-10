import React from "react";
import { ArrowRightMedium, CloseMedium } from "@ledgerhq/icons-ui/native";
import { TouchableOpacityProps, TouchableOpacity, Image } from "react-native";
import styled, { useTheme } from "styled-components/native";

import Text from "../../Text";
import Flex from "../../Layout/Flex";
import Link from "../../cta/Link";
import { highlight } from "../helper";

export type CardProps = TouchableOpacityProps & {
  tag?: string;
  title?: string;
  cta?: string;
  imageUrl?: string;
  onPressDismiss?: () => void;
};

export const Base = styled(TouchableOpacity)`
  border-radius: 8px;
`;

export const Container = styled(Flex)`
  background: ${(p) => p.theme.colors.neutral.c20};
  flex-direction: row;
  border-radius: 8px;
`;

export const ImageContainer = styled(Flex)`
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  position: relative;
`;
export const ImageContent = styled(Image)`
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  opacity: 0.6;
`;

export const CloseContainer = styled(TouchableOpacity)`
  background-color: ${(p) => p.theme.colors.neutral.c30};
  position: absolute;
  right: 8px;
  top: 8px;
  border-radius: 50;
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

const ImageComponent = (props: CardProps) => (
  <ImageContainer width={props.imageUrl ? 115 : 0}>
    <ImageContent
      source={{
        uri: props.imageUrl,
      }}
      style={{ width: "100%", height: "100%" }}
    />
    <CloseButton onPressDismiss={props.onPressDismiss} />
  </ImageContainer>
);

const TextComponent = (props: CardProps) => (
  <Flex justifyContent={"space-between"} alignItems={"flex-start"} p={"12px"} flex={1}>
    <Text
      variant={"small"}
      fontWeight={"semiBold"}
      color="neutral.c70"
      uppercase
      numberOfLines={1}
      maxWidth={"80%"}
    >
      {props.tag}
    </Text>

    {props.title && (
      <Text
        variant="large"
        numberOfLines={3}
        fontWeight="semiBold"
        color="neutral.c100"
        lineHeight="18.2px"
      >
        {highlight(props.title, "large")}
      </Text>
    )}

    <Link
      type={"main"}
      size={"medium"}
      iconPosition="right"
      Icon={() => <ArrowRightMedium color="primary.c80" />}
      onPress={props.onPress}
      numberOfLines={1}
    >
      <Text variant="paragraph" fontWeight="semiBold" color="primary.c80" numberOfLines={1}>
        {props.cta}
      </Text>
    </Link>
  </Flex>
);

const CardContainer = (props: CardProps): React.ReactElement => {
  const { imageUrl, onPressDismiss } = props;

  return (
    <Container height={125}>
      <TextComponent {...props} />
      <ImageComponent imageUrl={imageUrl} onPressDismiss={onPressDismiss} />
    </Container>
  );
};

const SideImageCard = (props: CardProps): React.ReactElement => {
  return (
    <Base {...props} activeOpacity={0.5}>
      <CardContainer {...props} />
    </Base>
  );
};

export default SideImageCard;
