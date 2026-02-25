import React from "react";
import styled, { keyframes } from "styled-components";
import { system, size, SizeProps } from "styled-system";

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const Loader = styled.svg<SizeProps>`
  animation: ${rotate} 1s linear infinite;
  ${size}
  ${system({
    stroke: {
      property: "stroke",
      scale: "colors",
    },
  })}
`;
export type Props = React.ComponentProps<typeof Loader> & {
  color?: string;
};

export default function InfiniteLoader({
  size = 38,
  color = "primary.c50",
  ...extraProps
}: Props): JSX.Element {
  return (
    <Loader
      size={size}
      stroke={color}
      viewBox="0 0 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...extraProps}
    >
      <linearGradient
        id="gradient-start"
        gradientUnits="userSpaceOnUse"
        gradientTransform="rotate(-20)"
      >
        <stop offset="0" stopColor="white" stopOpacity="0.5" />
        <stop offset="1" stopColor="white" stopOpacity="1" />
      </linearGradient>
      <linearGradient
        id="gradient-end"
        gradientUnits="userSpaceOnUse"
        gradientTransform="rotate(-20)"
      >
        <stop offset="0" stopColor="white" stopOpacity="0.5" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>

      <mask id="gradient-mask" maskUnits="userSpaceOnUse">
        <rect
          x="-0"
          y="-4"
          width="44"
          height="22"
          strokeWidth="0"
          fill="url(#gradient-start)"
          transform="rotate(10)"
        />
        <rect
          x="0"
          y="18"
          width="44"
          height="21"
          strokeWidth="0"
          fill="url(#gradient-end)"
          transform="rotate(10)"
        />
      </mask>
      <path
        d="M34.8807 20.9499C35.3608 17.0398 34.3815 13.09 32.1304 9.85712C29.8793 6.6242 26.5146 4.33541 22.6808 3.42914C18.847 2.52287 14.8136 3.06283 11.3532 4.94559C7.89277 6.82836 5.24858 9.92158 3.92708 13.6328C2.60558 17.344 2.69968 21.4123 4.19135 25.0584C5.68302 28.7045 8.4674 31.6722 12.0112 33.3929C15.5549 35.1137 19.609 35.4666 23.3968 34.384C27.1846 33.3015 30.4398 30.8596 32.5391 27.526"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        mask="url(#gradient-mask)"
      />
    </Loader>
  );
}
