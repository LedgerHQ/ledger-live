import styled, { keyframes } from "styled-components";
import image from "./image";

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export type Props = {
  size?: number;
};

const InfiniteLoader = styled.img.attrs(({ size = 28 }: Props) => ({
  alt: "loading...",
  src: `data:image/png;base64,${image}`,
  width: size,
  height: size,
}))<Props>`
  animation: ${rotate} 1s linear infinite;
  transition: 100ms linear transform;
`;

export default InfiniteLoader;
