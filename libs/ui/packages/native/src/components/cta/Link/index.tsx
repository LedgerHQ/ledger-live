import React from "react";
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from "react-native";
import styled, { useTheme } from "styled-components/native";
import Text from "../../Text";
import { getLinkColors } from "./getLinkStyle";
import { ctaIconSize, ctaTextType } from "../getCtaStyle";

export type LinkProps = Omit<PressableProps, "onPress"> & {
  onPress?: PressableProps["onPress"] | (() => void);
  Icon?: React.ComponentType<{ size: number; color: string }>;
  type?: "main" | "shade" | "color";
  size?: "small" | "medium" | "large";
  iconPosition?: "right" | "left";
  disabled?: boolean;
  reversed?: boolean;
  children?: React.ReactNode;
  numberOfLines?: number;
};

const IconContainer = styled.View<{
  iconPosition: "right" | "left";
  iconLink?: boolean;
}>`
  ${(p) =>
    p.iconLink ? "" : p.iconPosition === "left" ? `margin-right: 4px;` : `margin-left: 4px;`}
`;

export const Base = styled(Pressable)`
  flex-direction: row;
  text-align: center;
  align-items: center;
  justify-content: center;
`;

const LinkContainer = (props: LinkProps): React.ReactElement => {
  const {
    Icon,
    iconPosition = "right",
    children,
    size = "medium",
    reversed,
    type = "main",
    disabled,
    numberOfLines,
  } = props;
  const { colors } = useTheme();
  const colorValue =
    getLinkColors(colors)[reversed ? "reversed" : "default"][disabled ? "disabled" : type];

  return (
    <>
      {iconPosition === "right" && children ? (
        <Text
          variant={ctaTextType[size]}
          fontWeight={"semiBold"}
          color={colorValue}
          numberOfLines={numberOfLines}
        >
          {children}
        </Text>
      ) : null}
      {Icon ? (
        <IconContainer iconLink={!children} iconPosition={iconPosition}>
          <Icon size={ctaIconSize[size]} color={colorValue} />
        </IconContainer>
      ) : null}
      {iconPosition === "left" && children ? (
        <Text
          variant={ctaTextType[size]}
          fontWeight={"semiBold"}
          color={colorValue}
          numberOfLines={numberOfLines}
        >
          {children}
        </Text>
      ) : null}
    </>
  );
};

const Link = (props: LinkProps): React.ReactElement => {
  const { type = "main", size = "medium" } = props;

  function style(state: PressableStateCallbackType): StyleProp<ViewStyle> {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return [props.style, state.pressed ? { opacity: 0.5 } : {}] as StyleProp<ViewStyle>;
  }

  return (
    <Base pointerEvents="box-only" hitSlop={16} {...props} style={style} accessible>
      <LinkContainer {...props} type={type} size={size} />
    </Base>
  );
};

export default Link;
