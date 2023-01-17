import * as icons from "@ledgerhq/crypto-icons-ui/native";
import React from "react";
import { ensureContrast } from "../../styles";
import styled, { useTheme } from "styled-components/native";

import Text from "../Text/index";
import Flex from "../Layout/Flex";

export type Props = {
  name: string;
  size?: number;
  color?: string;
  backgroundColor?: string; // overrides background color to ensure contrast with icon color
  circleIcon?: boolean;
  disabled?: boolean;
  tokenIcon?: string;
  fallbackIcon?: JSX.Element;
};

type IconBoxProps = {
  children: JSX.Element;
} & Props;

type FallbackProps = {
  name: string;
};

export const iconNames = Array.from(
  Object.keys(icons).reduce((set, rawKey) => {
    const key = rawKey;
    if (!set.has(key)) set.add(key);
    return set;
  }, new Set<string>()),
);

const Container = styled(Flex).attrs((p: { size: number }) => ({
  heigth: p.size,
  width: p.size,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
}))<{ size: number }>``;

const Circle = styled(Flex).attrs((p: { size: number; backgroundColor: string }) => ({
  heigth: p.size,
  width: p.size,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  borderRadius: 50.0,
  backgroundColor: p.backgroundColor,
}))<{ size: number }>``;

const TokenContainer = styled(Flex).attrs(
  (p: { size: number; borderColor: string; backgroundColor: string }) => ({
    position: "absolute",
    bottom: "-2px",
    right: "-5px",
    alignItems: "center",
    justifyContent: "center",
    heigth: p.size,
    width: p.size,
    borderRadius: 50.0,
    border: `2px solid ${p.borderColor}`,
    backgroundColor: p.backgroundColor,
    zIndex: 0,
  }),
)<{ size: number }>``;

function Fallback({ name }: FallbackProps) {
  return (
    <Text uppercase color="neutral.c70">
      {name.slice(0, 1)}
    </Text>
  );
}

const IconBox = ({
  children,
  color,
  backgroundColor,
  disabled,
  size = 16,
  tokenIcon = "",
}: IconBoxProps) => {
  const { colors } = useTheme();
  if (tokenIcon in icons) {
    // @ts-expect-error FIXME I don't know how to make you happy ts
    const Component = icons[tokenIcon];
    const defaultColor = Component.DefaultColor;
    const iconColor = disabled ? colors.neutral.c70 : color || defaultColor;
    const contrastedColor = ensureContrast(iconColor, backgroundColor || colors.background.main);
    return (
      <Container size={size}>
        {children}
        {tokenIcon && (
          <TokenContainer
            size={size / 3}
            borderColor={colors.background.main}
            backgroundColor={contrastedColor}
          >
            <Component size={size} color={colors.background.main} />
          </TokenContainer>
        )}
      </Container>
    );
  }
  return children;
};

const CryptoIcon = ({
  name,
  size = 16,
  color,
  backgroundColor,
  circleIcon,
  disabled,
  tokenIcon,
  fallbackIcon,
}: Props): JSX.Element => {
  const { colors } = useTheme();
  const maybeIconName = `${name}`;
  if (maybeIconName in icons) {
    // @ts-expect-error FIXME I don't know how to make you happy ts
    const Component = icons[maybeIconName];
    const defaultColor = Component.DefaultColor;
    const iconColor = disabled ? colors.neutral.c70 : color || defaultColor;
    const contrastedColor = ensureContrast(iconColor, backgroundColor || colors.background.main);

    return (
      <IconBox size={size} tokenIcon={tokenIcon} color={color} disabled={disabled} name={name}>
        {tokenIcon || circleIcon ? (
          <Circle backgroundColor={contrastedColor} size={size}>
            <Component size={size} color={colors.background.main} />
          </Circle>
        ) : (
          <Component size={size} color={contrastedColor} />
        )}
      </IconBox>
    );
  }
  if (fallbackIcon) {
    return fallbackIcon;
  }
  return <Fallback name={name} />;
};

export default CryptoIcon;
