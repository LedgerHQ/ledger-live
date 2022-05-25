import React from "react";
import styled, { useTheme } from "styled-components/native";
import { IconOrElementType } from "../type";
import Flex, { FlexBoxProps } from "../../Layout/Flex";

type Props = {
  Icon: IconOrElementType;
  variant?: "outlined" | "plain";
  shape?: "square" | "circle";
  color?: string;
  boxSize?: number;
  iconSize?: number;
  /**
   * Additional props to pass to the container component.
   * This component is a Flex element.
   */
  iconContainerProps?: FlexBoxProps;
};

const DEFAULT_BOX_VARIANT = "outlined";
const DEFAULT_BOX_SHAPE = "square";
const DEFAULT_BOX_SIZE = 56;
const DEFAULT_ICON_SIZE = 24;

const IconContainer = styled(Flex).attrs<{ size: Props["boxSize"]; variant: Props["variant"] }>(
  ({ size = DEFAULT_BOX_SIZE, variant = DEFAULT_BOX_VARIANT }) => ({
    justifyContent: "center",
    alignItems: "center",
    borderWidth: variant === "outlined" ? "1px" : 0,
    borderColor: "neutral.c40",
    width: `${size}px`,
    height: `${size}px`,
  }),
)<{ variant: Props["variant"]; shape: Props["shape"] }>`
  border-radius: ${(p) => (p.shape === "square" ? `${p.theme.radii[1]}px` : "9999px")};
  background: ${(p) => (p.variant === "plain" ? p.theme.colors.primary.c10 : "transparent")};
`;

export default function IconBox({
  Icon,
  color,
  variant = DEFAULT_BOX_VARIANT,
  shape = DEFAULT_BOX_SHAPE,
  boxSize = DEFAULT_BOX_SIZE,
  iconSize = DEFAULT_ICON_SIZE,
  iconContainerProps,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <IconContainer size={boxSize} variant={variant} shape={shape} {...iconContainerProps}>
      {React.isValidElement(Icon) ? (
        Icon
      ) : (
        <Icon
          size={iconSize}
          color={color || (variant === "plain" ? colors.primary.c70 : colors.neutral.c100)}
        />
      )}
    </IconContainer>
  );
}
