import React, { useCallback, useState } from "react";
import styled, { useTheme } from "styled-components/native";
import Text from "@components/Text";
import { Theme } from "@ui/styles/theme";
import getButtonStyle, { ButtonTypes, getButtonColor } from "./getButtonStyle";
import { ActivityIndicator } from "react-native";

type Props = {
  Icon?: React.ComponentType<{ size: number; color: string }>;
  children?: React.ReactNode;
  onPress: () => Promise<any> | any;
  type?: ButtonTypes;
  iconPosition?: "right" | "left";
  disabled?: boolean;
};

const IconContainer = styled.View<{
  iconPosition: "right" | "left";
  iconButton?: boolean;
}>`
  ${(p) =>
    p.iconButton
      ? ""
      : p.iconPosition === "left"
      ? `margin-right: 10px;`
      : `margin-left: 10px;`}
`;

export const Base = styled.TouchableOpacity<{
  type?: ButtonTypes;
  disabled?: boolean;
  theme: Theme;
  iconButton?: boolean;
}>`
  border-radius: ${(p) => p.theme.space[6]}px;
  height: ${(p) => p.theme.space[6]}px;
  flex-direction: row;
  border-style: solid;
  border-width: 1px;
  text-align: center;
  align-items: center;
  justify-content: center;
  align-content: center;
  background-color: transparent;
  border-color: transparent;
  overflow: hidden;
  position: relative;
  ${(p) =>
    getButtonStyle({
      type: p.type || undefined,
      disabled: p.disabled,
      theme: p.theme,
    })}
  ${(p) => (p.iconButton ? `padding: 0; width: ${p.theme.space[6]}px;` : "")}
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

const SpinnerContainer = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const ButtonContainer = ({
  Icon,
  iconPosition = "right",
  children,
  hide = false,
  ...props
}: Props & { hide?: boolean }): React.ReactElement => {
  const theme = useTheme();
  const { color } = getButtonColor({ ...props, theme });

  return (
    <Container hide={hide}>
      {iconPosition === "right" && children ? (
        <Text type="body" color={color}>
          {children}
        </Text>
      ) : null}
      {Icon ? (
        <IconContainer iconButton={!children} iconPosition={iconPosition}>
          <Icon size={15} color={color} />
        </IconContainer>
      ) : null}
      {iconPosition === "left" && children ? (
        <Text type="body" color={color}>
          {children}
        </Text>
      ) : null}
    </Container>
  );
};

const Button = (props: Props): React.ReactElement => {
  const { Icon, children, onPress, disabled = false } = props;
  return (
    <Base
      {...props}
      iconButton={Icon && !children}
      disabled={disabled}
      onPress={onPress}
    >
      <ButtonContainer {...props} />
    </Base>
  );
};

export const PromisableButton = (
  props: Props & { onPress: () => Promise<any> }
): React.ReactElement => {
  const { Icon, children, onPress, disabled = false } = props;

  const [spinnerOn, setSpinnerOn] = useState(false);
  const theme = useTheme();

  const onPressHandler = useCallback(async () => {
    if (!onPress) return;
    setSpinnerOn(true);
    try {
      await onPress();
    } finally {
      setSpinnerOn(false);
    }
  }, [onPress]);

  return (
    <Base
      {...props}
      iconButton={Icon && !children}
      disabled={disabled || spinnerOn}
      onPress={onPressHandler}
    >
      <ButtonContainer {...props} hide={spinnerOn} />
      <SpinnerContainer>
        <ActivityIndicator
          color={theme.colors.palette.neutral.c50}
          animating={spinnerOn}
        />
      </SpinnerContainer>
    </Base>
  );
};

export default Button;
