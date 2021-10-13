import React from "react";
import ReactNativeModal, { ModalProps } from "react-native-modal";
import styled, { useTheme } from "styled-components/native";
import { StyleProp, ViewStyle } from "react-native";

import sizes from "@ui/helpers/getDeviceSize";
import Link from "@components/cta/Link";
import CloseMedium from "../../../../assets/icons/CloseMedium";
import FlexBox from "@components/Layout/Flex";
import Text from "@components/Text";

const { width, height } = sizes;

export type BaseModalProps = {
  isOpen?: boolean;
  onClose?: () => void;
  modalStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  preventBackdropClick?: boolean;
  Icon?:
    | ((props: { size?: number; color?: string }) => React.ReactNode)
    | React.ReactNode;
  iconColor?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  children: React.ReactNode;
} & ModalProps;

const Container = styled.View`
  background-color: ${(p) => p.theme.colors.palette.environment.background};
  width: 100%;
  padding: 16px;
  min-height: 350px;
`;

const ContentContainer = styled.View`
  flex-shrink: 1;
  flex-grow: 1;
`;

const HeaderContainer = styled.View`
  display: flex;
  align-items: center;
  margin-bottom: ${(p) => p.theme.space[7]}px;
`;

const CloseContainer = styled.View`
  display: flex;
  align-items: flex-end;
  margin-bottom: ${(p) => p.theme.space[7]}px;
`;

const StyledTitle = styled(Text).attrs({ type: "h3" })`
  text-transform: uppercase;
`;

const StyledDescription = styled(Text).attrs({
  type: "body",
  color: "palette.neutral.c80",
})`
  text-transform: capitalize;
  margin-top: ${(p) => p.theme.space[2]}px;
`;

const StyledSubtitle = styled(Text).attrs({
  type: "subTitle",
  color: "palette.neutral.c80",
})`
  text-transform: uppercase;
  margin-bottom: ${(p) => p.theme.space[2]}px;
`;

const defaultModalStyle = {
  flex: 1,
  margin: 16,
};

export default function BaseModal({
  isOpen,
  onClose = () => {},
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
}: Partial<BaseModalProps>): React.ReactElement {
  const { colors } = useTheme();

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
      isVisible={isOpen}
      // @ts-expect-error  issue in typing in react-native-modal
      deviceWidth={width}
      // @ts-expect-error issue in typing in react-native-modal
      deviceHeight={height}
      useNativeDriver
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
      onModalHide={onClose}
      style={[defaultModalStyle, modalStyle]}
    >
      <Container style={containerStyle}>
        <CloseContainer>
          <Link Icon={CloseMedium} onPress={onClose} />
        </CloseContainer>
        <HeaderContainer>
          {Icon && (
            <FlexBox mb={24}>
              {typeof Icon === "function"
                ? Icon({
                    size: 48,
                    color: iconColor || colors.palette.neutral.c100,
                  })
                : Icon}
            </FlexBox>
          )}
          {subtitle && <StyledSubtitle>{subtitle}</StyledSubtitle>}
          {title && <StyledTitle>{title}</StyledTitle>}
          {description && <StyledDescription>{description}</StyledDescription>}
        </HeaderContainer>
        <ContentContainer>{children}</ContentContainer>
      </Container>
    </ReactNativeModal>
  );
}
