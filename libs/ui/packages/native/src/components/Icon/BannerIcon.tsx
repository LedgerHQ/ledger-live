import React, { type PropsWithChildren } from "react";
import Svg, { Defs, LinearGradient, Rect, RectProps, Stop } from "react-native-svg";
import styled, { useTheme } from "styled-components/native";

import * as Icons from "@ledgerhq/icons-ui/native";
import { ColorPalette } from "../../styles";
import { Flex } from "../Layout";

type IconKey = keyof typeof Icons;
type IconPalette = { fg: string; bg: string };

function getColorsByIcon(colors: ColorPalette): Partial<Record<IconKey, Partial<IconPalette>>> {
  const { warning } = colors;

  return {
    Warning: { fg: warning.c80, bg: warning.c30 },
  };
}

function getDefaultDefaultColors({ primary }: ColorPalette): IconPalette {
  return { fg: primary.c80, bg: primary.c80 };
}

type Props = Readonly<{
  icon: IconKey;
}>;

export default function BannerIcon({ icon }: Props) {
  const { colors } = useTheme();
  const defaultColors = getDefaultDefaultColors(colors);
  const safeIcon: IconKey = icon in Icons ? icon : "Information";
  const Icon = Icons[safeIcon];
  const { fg: iconColor = defaultColors.fg, bg: iconBgColor = defaultColors.bg } =
    getColorsByIcon(colors)[safeIcon] ?? {};

  return (
    <IconContainer color={iconBgColor}>
      <Icon color={iconColor} />
    </IconContainer>
  );
}

function IconContainer({ color, children }: PropsWithChildren<{ color: string }>) {
  const { theme } = useTheme();

  return (
    <Flex width={52} height={52} alignItems="center" justifyContent="center">
      <IconBg viewBox="0 0 52 52" fill="none">
        <Defs>
          <VGradient
            id="fillGrad"
            gradient={
              theme === "dark"
                ? { 0: ["#FFF", 0.05], 1: ["#1D1C1F", 0] }
                : { 0: ["#1D1C1F", 0.05], 1: ["#1D1C1F", 0] }
            }
          />
          <VGradient
            id="strokeGrad"
            gradient={
              theme === "dark"
                ? { 0: ["#FFF", 1], 1: ["#000", 0.5] }
                : { 0: ["#000", 0.3], 1: ["#000", 0] }
            }
          />
        </Defs>

        <Square offset={0} size={52} rx={13.5} fill="url(#fillGrad)" />
        <BorderSquare offset={0.25} size={51.5} rx={13.5} stroke="url(#strokeGrad)" />
        <Square offset={7.25} size={38} rx={8.7} fill={color} fillOpacity={0.08} />
      </IconBg>

      {children}
    </Flex>
  );
}

type SquareProps = { offset: number; size: number } & RectProps;
function Square({ offset, size, ...rectProps }: SquareProps) {
  return <Rect x={offset} y={offset} width={size} height={size} {...rectProps} />;
}

type Colors = Record<`${number}%` | number, [string, number]>;
type VGradientProps = { id: string; gradient: Colors };
function VGradient({ id, gradient }: VGradientProps) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
      {Object.entries(gradient).map(([offset, [hex, opacity]]) => (
        <Stop key={offset} offset={offset} stopColor={hex} stopOpacity={opacity} />
      ))}
    </LinearGradient>
  );
}

const IconBg = styled(Svg).attrs({ xmlns: "http://www.w3.org/2000/svg" })`
  position: absolute;
  inset: 0;
`;

const BorderSquare = styled(Square)`
  stroke-opacity: 0.16px;
  stroke-width: 0.5px;
`;
