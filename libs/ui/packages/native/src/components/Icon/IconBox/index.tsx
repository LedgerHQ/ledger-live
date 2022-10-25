import React from "react";
import styled, { useTheme } from "styled-components/native";
import { IconOrElementType } from "../type";
import Flex, { FlexBoxProps } from "../../Layout/Flex";

export type Props = {
  Icon: IconOrElementType;
  color?: string;
  boxSize?: number;
  iconSize?: number;
  /**
   * Additional props to pass to the container component.
   * This component is a Flex element.
   */
  iconContainerProps?: FlexBoxProps;
};

const DEFAULT_BOX_SIZE = 56;
const DEFAULT_ICON_SIZE = 24;

const IconContainer = styled(Flex).attrs<{ size: Props["boxSize"] }>(
  ({ size = DEFAULT_BOX_SIZE }) => ({
    justifyContent: "center",
    alignItems: "center",
    borderWidth: "1px",
    borderColor: "neutral.c40",
    width: `${size}px`,
    height: `${size}px`,
  }),
)`
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
`;

export default function IconBox({
  Icon,
  color,
  boxSize = DEFAULT_BOX_SIZE,
  iconSize = DEFAULT_ICON_SIZE,
  iconContainerProps,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <IconContainer size={boxSize} {...iconContainerProps}>
      {React.isValidElement(Icon) ? (
        Icon
      ) : (
        <Icon size={iconSize} color={color || colors.neutral.c100} />
      )}
    </IconContainer>
  );
}
