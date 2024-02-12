import React from "react";
import styled, { useTheme } from "styled-components/native";
import { PixelRatio } from "react-native";
import { Rect, ClipPath, Svg, Defs } from "react-native-svg";
import Flex from "../Layout/Flex";
import Box from "../Layout/Box";
import { IconOrElementType, NewIconOrElementType, NewIconProps, IconType } from "./type";

export const DEFAULT_BOX_SIZE = 40;
export const DEFAULT_ICON_SIZE = 16;
export const DEFAULT_BADGE_SIZE = 20;
const BORDER_RADIUS = 2;

function getClipRectangleSize(badgeSize: number): number {
  return (3 / 4) * badgeSize;
}

const Container = styled(Flex).attrs((p: { size: number }) => ({
  heigth: p.size,
  width: p.size,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflow: "visible",
}))<{ size: number }>``;

const IconBoxBackground = styled(Flex)<{
  size: number;
  variant?: Variant;
}>`
  position: absolute;
  height: ${(p) => p.size}px;
  width: ${(p) => p.size}px;
  border-radius: ${(p) => (p.variant === "circle" ? p.size : p.theme.radii[BORDER_RADIUS])}px;
`;

const BadgeContainer = styled.View<{ badgeSize: number }>`
  position: absolute;
  overflow: visible;
  ${(p) => `
    top: -${p.badgeSize / 2 - 2}px;
    right: -${p.badgeSize / 2 - 2}px;
    height: ${p.badgeSize}px;
    width: ${p.badgeSize}px;`}
`;

export type Variant = "square" | "circle";

export type IconBoxProps = {
  /**
   * Component that takes `{size?: number; color?: string}` as props. Will be rendered at the top right with the size provided in `badgeSize` or a default size.
   */
  Badge?: IconType;
  /**
   * Color of the background, only applied if no Badge is provided
   */
  backgroundColor?: string;
  /**
   * Color of the border
   */
  borderColor?: string;
  /**
   * Badge color, will be applied to the component provided in the `Badge` prop
   */
  badgeColor?: string;
  /**
   * Badge size, will be applied to the component provided in the `Badge` prop
   */
  badgeSize?: number;
  children?: JSX.Element;
  /**
   * Box size for preview
   */
  size?: number;
  /**
   * Box variant (box or circled)
   */
  variant?: Variant;
};

export type BoxedIconProps = IconBoxProps & {
  /**
   * Component that takes `{size?: number | "XS/S/M/L/XL"; color?: string}` as props. Will be rendered at the top right with the size provided in `iconSize` or a default size.
   */
  Icon: IconOrElementType | NewIconOrElementType;
  /**
   * Icon size, will be applied to the component provided in the `Icon` prop
   */
  iconSize?: number | NewIconProps["size"];
  /**
   * Icon color, will be applied to the component provided in the `Icon` prop
   */
  iconColor?: string;
};

/** This component is needed to draw a border that is clipped behind the badge icon */
const IconBoxBackgroundSVG = ({
  size,
  borderColor,
  badgeSize,
  variant = "square",
}: {
  size: number;
  borderColor: string;
  badgeSize: number;
  variant?: Variant;
}) => {
  const { colors, radii } = useTheme();
  const borderRadius = radii[BORDER_RADIUS];
  const borderWidth = 1;
  const paletteStr = borderColor.split(".")[0];
  // @ts-expect-error idk how to handle this properly pls help
  const palette = colors[paletteStr];
  const strokeColor =
    (palette ? palette[borderColor.split(".")[1]] : borderColor) || colors.neutral.c40;

  const squareSize = getClipRectangleSize(badgeSize);

  /**
   * The following adjustments are necessary to have visual consistency
   *  between RN (native) Views with border and this component
   */
  const svgSize = size + borderWidth;
  const rectSize = size - borderWidth;
  const rectRadius = variant === "circle" ? size : borderRadius - borderWidth / 2;

  return (
    <Box position="absolute" overflow="hidden">
      <Svg height={svgSize} width={svgSize}>
        <Defs>
          <ClipPath id="clip">
            <Rect x="0" y="0" width={svgSize - squareSize} height={squareSize} />
            <Rect x="0" y={squareSize} width={"100%"} height={svgSize - squareSize} />
          </ClipPath>
        </Defs>
        <Rect
          strokeWidth={PixelRatio.roundToNearestPixel(borderWidth)}
          stroke={strokeColor}
          x={borderWidth}
          y={borderWidth}
          rx={rectRadius}
          ry={rectRadius}
          width={rectSize}
          height={rectSize}
          fill="transparent"
          clipPath="url(#clip)"
        />
      </Svg>
    </Box>
  );
};

export const IconBox = ({
  Badge,
  size = DEFAULT_BOX_SIZE,
  children,
  borderColor = "neutral.c40",
  backgroundColor = "transparent",
  badgeColor,
  badgeSize = DEFAULT_BADGE_SIZE,
  variant = "square",
}: IconBoxProps) => {
  const hasBadge = !!Badge;
  return (
    <Container size={size}>
      {hasBadge ? (
        <IconBoxBackgroundSVG
          size={size}
          badgeSize={badgeSize}
          borderColor={borderColor}
          variant={variant}
        />
      ) : (
        <IconBoxBackground
          border="1px solid"
          size={size}
          borderColor={borderColor}
          variant={variant}
          backgroundColor={backgroundColor}
        />
      )}
      {children}
      {hasBadge && (
        <BadgeContainer badgeSize={badgeSize}>
          <Badge size={badgeSize} color={badgeColor} />
        </BadgeContainer>
      )}
    </Container>
  );
};

const BoxedIcon = ({
  Icon,
  iconSize = DEFAULT_ICON_SIZE,
  iconColor,
  ...iconBoxProps
}: BoxedIconProps) => {
  return (
    <IconBox {...iconBoxProps}>
      {React.isValidElement(Icon) ? (
        Icon
      ) : (
        /* @ts-expect-error TS 5 can't seem to be able to prove this is a react comopnent here */
        <Icon size={iconSize || DEFAULT_ICON_SIZE} color={iconColor} />
      )}
    </IconBox>
  );
};

export default BoxedIcon;
