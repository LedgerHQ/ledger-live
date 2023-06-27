import React, { useCallback, useState, useMemo } from "react";
import styled, { useTheme } from "styled-components/native";

import { ActivityIndicator, TouchableOpacity, TouchableOpacityProps, View } from "react-native";
import { buttonSizeStyle, getButtonColorStyle } from "../../cta/Button/getButtonStyle";
import { ctaIconSize, ctaTextType } from "../../cta/getCtaStyle";
import Text from "../../Text";
import { Icon as IconComponent } from "../../Icon";
import baseStyled, { BaseStyledProps } from "../../styled";
import { IconType } from "../../Icon/type";

export type ButtonProps = TouchableOpacityProps &
  BaseStyledProps & {
    Icon?: IconType;
    iconName?: string;
    type?: "main" | "shade" | "error" | "color" | "default";
    size?: "small" | "medium" | "large";
    iconPosition?: "right" | "left";
    outline?: boolean;
    disabled?: boolean;
    pressed?: boolean;
    children?: React.ReactNode;
    pending?: boolean;
    displayContentWhenPending?: boolean;
    testID?: string;
  };

const IconContainer = styled.View<{
  iconPosition: "right" | "left";
  iconButton?: boolean;
}>`
  ${(p) =>
    p.iconButton ? "" : p.iconPosition === "left" ? `margin-right: 10px;` : `margin-left: 10px;`}
`;

export const Base = baseStyled(TouchableOpacity).attrs<ButtonProps>((p) => ({
  ...getButtonColorStyle(p.theme.colors, p).button,
  // Avoid conflict with styled-system's size property by nulling size and renaming it
  size: undefined,
  sizeVariant: p.size,
}))<
  {
    iconButton?: boolean;
    sizeVariant?: ButtonProps["size"];
  } & Omit<ButtonProps, "size">
>`

  border-radius: ${(p) => p.theme.space[10]}px;
  padding: 0 ${(p) => p.theme.space[7]}px;
  flex-direction: row;
  border-style: solid;
  text-align: center;
  align-items: center;
  justify-content: center;
  align-content: center;
  overflow: hidden;
  position: relative;
  ${(p) => buttonSizeStyle[p.sizeVariant || "medium"]}

  ${(p) => (p.iconButton ? `padding: 0; width: ${p.theme.space[10]}px;` : "")}
`;

const Container = styled.View<{
  hide?: boolean;
}>`
  flex-direction: row;
  text-align: center;
  align-items: center;
  justify-content: center;
  align-content: center;
  opacity: ${(p) => (p.hide ? 0 : 1)};
`;

const SpinnerContainer = styled.View<{
  displayContentWhenPending?: boolean;
}>`
  position: ${(p) => (p.displayContentWhenPending ? "relative" : "absolute")};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const ButtonContainer = (props: ButtonProps & { hide?: boolean }): React.ReactElement => {
  const {
    Icon,
    iconPosition = "right",
    children,
    hide = false,
    size = "medium",
    iconName,
    pending,
    displayContentWhenPending,
  } = props;
  const theme = useTheme();
  const { text } = getButtonColorStyle(theme.colors, props);

  const IconNode = useMemo(
    () =>
      (iconName && <IconComponent name={iconName} size={ctaIconSize[size]} color={text.color} />) ||
      (Icon && <Icon size={ctaIconSize[size]} color={text.color} />),
    [iconName, size, Icon, text.color],
  );

  const textColor = useMemo(
    () => (pending ? theme.colors.neutral.c50 : text.color),
    [pending, theme.colors.neutral.c50, text.color],
  );

  return (
    <Container hide={hide}>
      {iconPosition === "right" && children ? (
        <Text variant={ctaTextType[size]} fontWeight={"semiBold"} color={textColor}>
          {children}
        </Text>
      ) : null}
      {pending && displayContentWhenPending ? (
        <IconContainer iconPosition={iconPosition}>
          <SpinnerContainer displayContentWhenPending>
            <ActivityIndicator color={theme.colors.neutral.c50} animating />
          </SpinnerContainer>
        </IconContainer>
      ) : IconNode ? (
        <IconContainer iconButton={!children} iconPosition={iconPosition}>
          {IconNode}
        </IconContainer>
      ) : null}
      {iconPosition === "left" && children ? (
        <Text variant={ctaTextType[size]} fontWeight={"semiBold"} color={textColor}>
          {children}
        </Text>
      ) : null}
    </Container>
  );
};

const Button = (props: ButtonProps): React.ReactElement => {
  const {
    Icon,
    children,
    type = "default",
    iconName,
    disabled = false,
    pending = false,
    displayContentWhenPending = false,
    testID,
  } = props;
  const theme = useTheme();

  return (
    <Base
      {...props}
      type={type}
      iconButton={(!!Icon || !!iconName) && !children}
      activeOpacity={1}
      disabled={disabled || pending}
      testID={testID}
    >
      <View>
        <ButtonContainer {...props} type={type} hide={pending && !displayContentWhenPending} />
        {pending && !displayContentWhenPending ? (
          <SpinnerContainer displayContentWhenPending={displayContentWhenPending}>
            <ActivityIndicator color={theme.colors.neutral.c50} animating />
          </SpinnerContainer>
        ) : null}
      </View>
    </Base>
  );
};

export const PromisableButton = (props: ButtonProps): React.ReactElement => {
  const { Icon, children, onPress, type = "main", disabled = false, iconName } = props;

  const [spinnerOn, setSpinnerOn] = useState(false);
  const theme = useTheme();

  const onPressHandler = useCallback(
    async (event) => {
      if (!onPress) return;
      setSpinnerOn(true);
      try {
        await onPress(event);
      } finally {
        setSpinnerOn(false);
      }
    },
    [onPress],
  );

  return (
    <Base
      {...props}
      type={type}
      iconButton={(!!Icon || !!iconName) && !children}
      disabled={disabled || spinnerOn}
      onPress={onPressHandler}
    >
      <View>
        <ButtonContainer {...props} type={type} hide={spinnerOn} />
        <SpinnerContainer>
          <ActivityIndicator color={theme.colors.neutral.c50} animating={spinnerOn} />
        </SpinnerContainer>
      </View>
    </Base>
  );
};

export default Button;
