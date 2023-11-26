import React from "react";
import { ChevronRightMedium, CloseMedium } from "@ledgerhq/icons-ui/nativeLegacy";
import { TouchableOpacityProps, TouchableOpacity } from "react-native";
import styled, { useTheme } from "styled-components/native";

import Text from "../../Text";
import Flex from "../../Layout/Flex";

export type CardProps = TouchableOpacityProps & {
  title?: string;
  onPressDismiss?: () => void;
  LeftElement?: JSX.Element;
  hideLeftElementContainer?: boolean;
  typeOfRightIcon: "arrow" | "close";
};

type CloseProps = {
  onPressDismiss?: () => void;
};

export const Container = styled(TouchableOpacity)`
  background: ${(p) => p.theme.colors.opacityDefault.c05};
  flex-direction: row;
  backdrop-filter: blur(62px);
  border-radius: 12px;
  height: 72px;
  padding: ${(p) => p.theme.space[6]}px;
  align-items: center;
  justify-content: space-between;
  z-index: 5;
`;

export const CloseContainer = styled(TouchableOpacity)`
  background-color: ${(p) => p.theme.colors.opacityDefault.c05};
  border-radius: 50;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ChevronContainer = styled(Flex)`
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const CloseButton = ({ onPressDismiss }: CloseProps) => {
  const { colors } = useTheme();
  return (
    <CloseContainer onPress={onPressDismiss}>
      <CloseMedium size={14} color={colors.neutral.c100} />
    </CloseContainer>
  );
};

const CardContainer = (props: CardProps): React.ReactElement => {
  const { onPressDismiss, LeftElement, hideLeftElementContainer, title, typeOfRightIcon } = props;

  return (
    <Container {...props}>
      {hideLeftElementContainer ? (
        <Flex
          borderRadius={50}
          height={40}
          width={40}
          alignItems="center"
          justifyContent="center"
          bg={"opacityDefault.c05"}
        >
          {LeftElement}
        </Flex>
      ) : (
        LeftElement
      )}

      <Text
        mx={4}
        variant="large"
        fontWeight="medium"
        numberOfLines={3}
        maxWidth={"70%"}
        color="neutral.c100"
      >
        {title}
      </Text>
      {typeOfRightIcon === "close" ? (
        <CloseButton onPressDismiss={onPressDismiss} />
      ) : (
        <ChevronContainer>
          <ChevronRightMedium size={24} />
        </ChevronContainer>
      )}
    </Container>
  );
};

const BannerCard = (props: CardProps): React.ReactElement => {
  return <CardContainer {...props} activeOpacity={0.5} />;
};

export default BannerCard;
