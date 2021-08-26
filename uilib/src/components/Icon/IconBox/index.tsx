import React from "react";
import styled, { useTheme } from "styled-components/native";

type Props = {
  Icon: React.ComponentType<{ size: number; color?: string }>;
  color?: string;
};

const IconContainer = styled.View`
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${(p) => p.theme.colors.palette.grey.border};
  border-radius: 4px;
`;

export default function IconBox({ Icon, color }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <IconContainer>
      <Icon size={18} color={color || colors.palette.text.default} />
    </IconContainer>
  );
}
