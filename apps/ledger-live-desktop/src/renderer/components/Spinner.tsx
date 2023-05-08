import React from "react";
import styled, { keyframes, css } from "styled-components";
import Box from "~/renderer/components/Box";
import IconLoader from "~/renderer/icons/Loader";

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export type RotatingProps = {
  size: number;
  isRotating?: boolean;
};

export const Rotating = styled(Box)<RotatingProps>`
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

export type SpinnerProps = {
  size: number;
} & React.ComponentProps<typeof Rotating>;

export default function Spinner({ size, ...props }: SpinnerProps) {
  return (
    <Rotating size={size} data-test-id="loading-spinner" {...props}>
      <IconLoader size={size} />
    </Rotating>
  );
}
