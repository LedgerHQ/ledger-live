import React from "react";
import styled, { useTheme } from "styled-components/native";
import Text from "@components/Text";
import { Theme } from "@ui/styles/theme";
import getButtonStyle, { ButtonTypes, getButtonColor } from "./getButtonStyle";

type Props = {
  Icon?: React.ComponentType<{ size: number; color: string }>;
  children?: React.ReactNode;
  onPress: () => void;
  type?: ButtonTypes;
  iconPosition?: "right" | "left";
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

const Button = ({
  Icon,
  iconPosition = "right",
  children,
  onPress,
  ...props
}: Props): React.ReactElement => {
  const theme = useTheme();
  const { color } = getButtonColor({ ...props, theme });
  return (
    <Base {...props} iconButton={Icon && !children} onPress={onPress}>
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
    </Base>
  );
};

export default Button;
