import React from "react";
import styled, { useTheme } from "styled-components/native";

type Props = {
  Icon: (props: { size?: number; color?: string }) => React.ReactElement;
  color?: string;
};

const IconContainer = styled.View`
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${(p) => p.theme.colors.palette.neutral.c40};
  border-radius: 4px;
`;

export default function IconBox({ Icon, color }: Props): React.ReactElement {
  const { colors } = useTheme();
  return (
    <IconContainer>
      <Icon size={24} color={color || colors.palette.neutral.c100} />
    </IconContainer>
  );
}
