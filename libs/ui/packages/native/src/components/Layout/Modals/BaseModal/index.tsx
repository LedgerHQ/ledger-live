import React from "react";
import ReactNativeModal, { ModalProps } from "react-native-modal";
import styled from "styled-components/native";
import { StyleProp, ViewStyle } from "react-native";

import sizes from "../../../../helpers/getDeviceSize";
import Link from "../../../cta/Link";
import CloseMedium from "@ledgerhq/icons-ui/native/CloseMedium";
import Text from "../../../Text";
import { IconOrElementType } from "../../../Icon/type";
import { BoxedIcon } from "../../../Icon";
import { Flex } from "../../index";
import { space } from "styled-system";

const { width, height } = sizes;

export type BaseModalProps = {
  isOpen?: boolean;
  onClose?: () => void;
  modalStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  preventBackdropClick?: boolean;
  Icon?: IconOrElementType;
  iconColor?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  children?: React.ReactNode;
  noCloseButton?: boolean;
} & Partial<ModalProps>;

const SafeContainer = styled.SafeAreaView`
  background-color: ${(p) => p.theme.colors.background.main};
`;

const Container = styled.View`
  background-color: ${(p) => p.theme.colors.background.main};
  width: 100%;
  padding: 16px;
  min-height: 350px;
`;

const ContentContainer = styled.View`
  flex-shrink: 1;
  flex-grow: 1;
`;

const CloseContainer = styled.View`
  display: flex;
  align-items: flex-end;
  margin-bottom: ${(p) => p.theme.space[7]}px;
`;

const ClosePressableExtendedBounds = styled.TouchableOpacity.attrs({
  p: 5,
  m: -5,
})`
  ${space};
`;

const StyledTitle = styled(Text).attrs({ variant: "h2" })`
  text-transform: uppercase;
`;

const StyledSubtitle = styled(Text).attrs({
  variant: "subtitle",
  color: "neutral.c80",
})`
  text-transform: uppercase;
  text-align: center;
  margin-bottom: ${(p) => p.theme.space[2]}px;
`;

const defaultModalStyle = {
  flex: 1,
  margin: 16,
};

export function ModalHeader({
  Icon,
  iconColor,
  title,
  description,
  subtitle,
}: Pick<
  BaseModalProps,
  "Icon" | "iconColor" | "title" | "description" | "subtitle"
>): React.ReactElement | null {
  if (!(Icon || subtitle || title || description)) return null;
  return (
    <Flex alignItems={"center"} mb={7}>
      {Icon && (
        <Flex mb={7}>
          {React.isValidElement(Icon) ? (
            Icon
          ) : (
            <BoxedIcon size={64} Icon={Icon} iconSize={24} iconColor={iconColor} />
          )}
        </Flex>
      )}
      {subtitle && <StyledSubtitle textAlign={"center"}>{subtitle}</StyledSubtitle>}
      {title && <StyledTitle textAlign={"center"}>{title}</StyledTitle>}
      {description && (
        <Text variant={"body"} color={"neutral.c70"} textAlign={"center"} mt={6}>
          {description}
        </Text>
      )}
    </Flex>
  );
}

export default function BaseModal({
  isOpen,
  onClose = () => {},
  noCloseButton,
  containerStyle = {},
  modalStyle = {},
  preventBackdropClick,
  Icon,
  iconColor,
  title,
  description,
  subtitle,
  children,
  ...rest
}: BaseModalProps): React.ReactElement {
  const backDropProps = preventBackdropClick
    ? {}
    : {
        onBackdropPress: onClose,
        onBackButtonPress: onClose,
        onSwipeComplete: onClose,
      };

  return (
    <ReactNativeModal
      {...rest}
      {...backDropProps}
      // @ts-expect-error TODO: Binding issues?
      isVisible={isOpen}
      deviceWidth={width}
      deviceHeight={height}
      useNativeDriver
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
      onModalHide={onClose}
      style={[defaultModalStyle, modalStyle]}
    >
      <SafeContainer>
        <Container style={containerStyle}>
          {!noCloseButton && (
            <CloseContainer>
              <ClosePressableExtendedBounds onPress={onClose}>
                <Link Icon={CloseMedium} onPress={onClose} />
              </ClosePressableExtendedBounds>
            </CloseContainer>
          )}
          <ModalHeader
            Icon={Icon}
            iconColor={iconColor}
            title={title}
            description={description}
            subtitle={subtitle}
          />
          <ContentContainer>{children}</ContentContainer>
        </Container>
      </SafeContainer>
    </ReactNativeModal>
  );
}
