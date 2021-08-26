import React from "react";
import ReactNativeModal from "react-native-modal";
import styled from "styled-components/native";

import sizes from "@ui/helpers/getDeviceSize";
import { ModalProps } from "@components/Layout/Modal";
import Text from "@components/Text";
import IconBox from "@components/Icon/IconBox";
import FlexBox from "@components/Layout/Flex";

type Props = {
  Icon?: React.ComponentType<{ size: number; color?: string }>;
  iconColor?: string;
  title?: string;
  description?: string;
  subtitle?: string;
};

const { width, height } = sizes;

const Container = styled.View`
  background-color: ${(p) => p.theme.colors.palette.background.default};
  padding-horizontal: ${(p) => p.theme.space[3]}px;
  padding-vertical: ${(p) => p.theme.space[6]}px;
`;

const TooltipHeaderContainer = styled.View`
  display: flex;
  align-items: center;
  margin-bottom: ${(p) => p.theme.space[4]}px;
`;

const StyledTitle = styled(Text).attrs({ type: "h3" })`
  text-transform: uppercase;
`;

const StyledDescription = styled(Text).attrs({
  type: "body",
  color: "palette.text.secondary",
})`
  text-transform: capitalize;
  margin-top: ${(p) => p.theme.space[1]}px;
`;

const StyledSubtitle = styled(Text).attrs({
  type: "subTitle",
  color: "palette.text.secondary",
})`
  text-transform: uppercase;
  margin-bottom: ${(p) => p.theme.space[1]}px;
`;

const modalStyle = {
  flex: 1,
  justifyContent: "flex-end",
  margin: 0,
};

export default function Tooltip({
  isOpen,
  onClose = () => {},
  containerStyle,
  preventBackdropClick,
  style,
  children,
  Icon,
  iconColor,
  title,
  description,
  subtitle,
  ...rest
}: Partial<ModalProps & Props>): React.ReactElement {
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
      hideModalContentWhileAnimating
      onModalHide={onClose}
      useNativeDriverForBackdrop
      swipeDirection={["down"]}
      propagateSwipe={true}
      style={[modalStyle, style || {}]}
    >
      <Container style={containerStyle}>
        <TooltipHeaderContainer>
          {Icon && (
            <FlexBox mb={24}>
              <IconBox Icon={Icon} color={iconColor} />
            </FlexBox>
          )}
          {subtitle && <StyledSubtitle>{subtitle}</StyledSubtitle>}
          {title && <StyledTitle>{title}</StyledTitle>}
          {description && <StyledDescription>{description}</StyledDescription>}
        </TooltipHeaderContainer>
        {children}
      </Container>
    </ReactNativeModal>
  );
}
