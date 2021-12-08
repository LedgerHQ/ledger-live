import React from "react";
import styled, { useTheme } from "styled-components/native";

type Props = {
  Icon:
    | ((props: { size?: number; color?: string }) => React.ReactElement)
    | React.ReactNode;
  color?: string;
  boxSize?: number;
  iconSize?: number;
};

type IconContainerProps = {
  size?: number;
};

const DEFAULT_BOX_SIZE = 56;
const DEFAULT_ICON_SIZE = 24;

const IconContainer = styled.View`
  width: ${(p: IconContainerProps) => (p.size ? p.size : DEFAULT_BOX_SIZE)}px;
  height: ${(p: IconContainerProps) => (p.size ? p.size : DEFAULT_BOX_SIZE)}px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${(p) => p.theme.colors.neutral.c40};
  border-radius: ${(p) => `${p.theme.radii[1]}px`};
`;

export default function IconBox({
  Icon,
  color,
  boxSize = DEFAULT_BOX_SIZE,
  iconSize = DEFAULT_ICON_SIZE,
}: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <IconContainer size={boxSize}>
      {typeof Icon === "function" ? (
        <Icon size={iconSize} color={color || colors.neutral.c100} />
      ) : (
        Icon
      )}
    </IconContainer>
  );
}
