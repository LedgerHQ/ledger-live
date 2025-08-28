import React from "react";
import styled from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";

// @ts-expect-error TypeScript 5.9 styled-components type arguments issue
export const MissingIconWrapper = styled.View<{ size: number; borderRadius?: number }>`
  border-radius: ${p => p.borderRadius}px;
  border: 1px solid transparent;
  background: ${p => p.theme?.colors.neutral.c60 || "#ccc"};
  height: ${p => p.size}px;
  width: ${p => p.size}px;
  min-height: ${p => p.size}px;
  min-width: ${p => p.size}px;
  align-items: center;
  justify-content: center;
  display: flex;
`;

/** Display a single letter as a fallback if an icon cannot be found */
export function MissingIcon({
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
    // @ts-expect-error TypeScript 5.9 styled-components props issue
    <MissingIconWrapper size={size} borderRadius={borderRadius}>
      <Text variant="large" fontWeight="bold" color="white" lineHeight={"19px"}>
        {initialLetter.toUpperCase()}
      </Text>
    </MissingIconWrapper>
  );
}

export default MissingIcon;
