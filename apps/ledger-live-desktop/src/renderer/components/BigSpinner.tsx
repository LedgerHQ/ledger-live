import React from "react";
import styled, { keyframes, css } from "styled-components";
import Box from "~/renderer/components/Box";
import IconBigSpinner from "~/renderer/icons/BigSpinner";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;
export const Rotating: ThemedComponent<{
  size: number;
  isRotating?: boolean;
}> = styled(Box)`
  width: ${p => p.size}px;
  height: ${p => p.size}px;
  animation: ${p =>
    p.isRotating === false
      ? "none"
      : css`
          ${rotate} 1s linear infinite
        `};
  transition: 100ms linear transform;
`;
export default function BigSpinner({ size, ...props }: { size: number; isRotating?: boolean }) {
  return (
    <Rotating size={size} data-test-id="big-loading-spinner" {...props}>
      <IconBigSpinner size={size} />
    </Rotating>
  );
}
