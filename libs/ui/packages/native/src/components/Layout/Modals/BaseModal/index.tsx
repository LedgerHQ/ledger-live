import React, { ReactNode, useCallback } from "react";
import ReactNativeModal, { ModalProps } from "react-native-modal";
import styled from "styled-components/native";
import { StyleProp, ViewStyle } from "react-native";

import sizes from "../../../../helpers/getDeviceSize";
import Text from "../../../Text";
import { IconOrElementType } from "../../../Icon/type";
import { BoxedIcon } from "../../../Icon";
import { Flex } from "../../index";
import { space } from "styled-system";
import { Close } from "@ledgerhq/icons-ui/native";
import { useTheme } from "styled-components/native";

const { width, height } = sizes;

export type BaseModalProps = {
  isOpen?: boolean;
  onClose?: () => void;
  modalStyle?: StyleProp<ViewStyle>;
  safeContainerStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  preventBackdropClick?: boolean;
  Icon?: IconOrElementType;
  iconColor?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
  noCloseButton?: boolean;
  CustomHeader?: React.ComponentType<{ children?: ReactNode }>;
} & Partial<ModalProps>;

const SafeContainer = styled.SafeAreaView`
  background-color: ${(p) => p.theme.colors.background.drawer};
`;

const Container = styled.View`
  background-color: ${(p) => p.theme.colors.background.drawer};
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
  margin-bottom: ${(p) => p.theme.space[6]}px;
  z-index: 10;
`;

const ClosePressableExtendedBounds = styled.TouchableOpacity.attrs({
  p: 3,
})`
  ${space};
  border-radius: 100px;
  background-color: ${(p) => p.theme.colors.neutral.c30};
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

export function ModalHeaderCloseButton({
  onClose,
}: Pick<BaseModalProps, "onClose">): React.ReactElement {
  const { colors } = useTheme();

  return (
    <CloseContainer>
      <ClosePressableExtendedBounds onPress={onClose}>
        <Close color={colors.neutral.c100} size="S" />
      </ClosePressableExtendedBounds>
    </CloseContainer>
  );
}

export default function BaseModal({
  isOpen,
  onClose = () => {},
  noCloseButton,
  safeContainerStyle = {},
  containerStyle = {},
  modalStyle = {},
  preventBackdropClick,
  Icon,
  iconColor,
  title,
  description,
  subtitle,
  children,
  onModalHide,
  CustomHeader,
  ...rest
}: BaseModalProps): React.ReactElement {
  const backDropProps = preventBackdropClick
    ? {}
    : {
        onBackdropPress: onClose,
        onBackButtonPress: onClose,
        onSwipeComplete: onClose,
      };

  // Workaround: until this, onModalHide={onClose}, making onClose being called twice and onModalHide being never called
  // The real fix would be to have onModalHide={onModalHide} and make sure every usage on onClose in the consumers of this component
  // expect the correct behavior
  const onModalHideWithClose = useCallback(() => {
    onClose();
    onModalHide && onModalHide();
  }, [onClose, onModalHide]);

  return (
    <ReactNativeModal
      {...backDropProps}
      {...rest}
      isVisible={!!isOpen}
      deviceWidth={width}
      deviceHeight={height}
      useNativeDriver
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
      onModalHide={onModalHideWithClose}
      style={[defaultModalStyle, modalStyle]}
    >
      <SafeContainer style={safeContainerStyle}>
        {CustomHeader && (
          <CustomHeader>
            {!noCloseButton && <ModalHeaderCloseButton onClose={onClose} />}
          </CustomHeader>
        )}
        <Container style={containerStyle}>
          {!CustomHeader && !noCloseButton && <ModalHeaderCloseButton onClose={onClose} />}
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
