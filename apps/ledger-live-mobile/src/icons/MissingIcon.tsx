import React from "react";
import styled from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";

export const MissingIconWrapper = styled.View<{ size: number; borderRadius?: number }>`
  border-radius: ${p => p.borderRadius}px;
  border: 1px solid transparent;
  background: ${p => p.theme.colors.neutral.c60};
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  min-height: ${p => p.size}px;
  min-width: ${p => p.size}px;
  align-items: center;
  justify-content: center;
  display: flex;
`;

/** Display a single letter as a fallback if an icon cannot be found */
export default function MissingIcon({
  initialLetter,
  size = 32,
  borderRadius = 12,
}: {
  /** Single letter */
  initialLetter: string;
  size?: number;
  borderRadius?: number;
}) {
  return (
    <MissingIconWrapper size={size} borderRadius={borderRadius}>
      <Text variant="large" fontWeight="bold" color="white" lineHeight={"19px"}>
        {initialLetter.toUpperCase()}
      </Text>
    </MissingIconWrapper>
  );
}
