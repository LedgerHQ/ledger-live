import React from "react";
import { SvgProps, Defs, LinearGradient, Stop } from "react-native-svg";
import { StyledPath, StyledSvg } from "./StyledSvg";

type Props = SvgProps & { size?: number; color: string };

const Graph = ({ color, size = 412, ...props }: Props) => (
  <StyledSvg
    width={size}
    height={size / 4.2}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <StyledPath
      fillRule="evenodd"
      clipRule="evenodd"
      d="m-34.757 9.547 3.781 14.432C-27.538 38.41-20.319 67.273-13.1 65.212c7.219-2.062 14.438-35.048 21.657-37.11 7.219-2.062 14.438 26.802 21.657 24.74 7.563-2.062 14.782-35.048 22-39.172 7.22-4.123 14.439 20.617 21.657 39.172 7.22 18.555 14.439 30.925 21.657 16.493 7.22-14.431 14.439-55.664 21.658-61.85 7.219-6.184 14.438 22.679 21.657 28.864 7.219 6.185 14.438-10.309 21.657-10.309 7.219 0 14.781 16.494 22 28.864 7.219 12.37 14.438 20.616 21.657 20.616 7.219 0 14.438-8.247 21.657-6.185 7.219 2.062 14.438 14.432 21.657 6.185 7.219-8.247 14.438-37.11 21.657-55.664 7.219-18.555 14.438-26.802 21.657-12.37 7.219 14.431 14.439 51.54 22.001 57.726 7.219 6.185 14.438-18.555 21.657-24.74 7.219-6.185 14.438 6.185 21.657 16.493 7.219 10.308 14.438 18.555 17.876 22.678l3.781 4.124v12.37H-34.757V9.546Z"
      fill="url(#a)"
    />
    <Defs>
      <LinearGradient
        id="a"
        x1={171.5}
        y1={0.136}
        x2={171.5}
        y2={96.136}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={color} />
        <Stop offset={1} stopColor={color} stopOpacity={0} />
      </LinearGradient>
    </Defs>
  </StyledSvg>
);

export default Graph;
