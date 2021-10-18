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

const InfiniteLoader = styled.img.attrs({
  alt: "loading...",
  src: `data:image/png;base64,${image}`,
  width: "28",
  height: "28",
})`
  animation: ${rotate} 1s linear infinite;
  transition: 100ms linear transform;
`;

export default InfiniteLoader;
