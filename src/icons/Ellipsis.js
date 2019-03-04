// @flow
import React from "react";
import Svg, { Use, Path, Defs, Mask, G } from "react-native-svg";

type Props = {
  size?: number,
  color?: string,
};

export default function Ellipsis({ size = 16, color = "#142533" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Defs>
        <Path
          id="a"
          d="M8 5.75A2.249 2.249 0 0 0 5.75 8 2.249 2.249 0 0 0 8 10.25 2.249 2.249 0 0 0 10.25 8 2.249 2.249 0 0 0 8 5.75zm0 3A.752.752 0 0 1 7.25 8c0-.412.338-.75.75-.75s.75.338.75.75-.338.75-.75.75zm5.5-3A2.249 2.249 0 0 0 11.25 8a2.249 2.249 0 0 0 2.25 2.25A2.249 2.249 0 0 0 15.75 8a2.249 2.249 0 0 0-2.25-2.25zm0 3a.752.752 0 0 1-.75-.75c0-.412.338-.75.75-.75s.75.338.75.75-.338.75-.75.75zm-11-3A2.249 2.249 0 0 0 .25 8a2.249 2.249 0 0 0 2.25 2.25A2.249 2.249 0 0 0 4.75 8 2.249 2.249 0 0 0 2.5 5.75zm0 3A.752.752 0 0 1 1.75 8c0-.412.337-.75.75-.75s.75.338.75.75-.337.75-.75.75z"
        />
      </Defs>
      <G fill="none" fillRule="evenodd">
        <Mask id="b" fill="#fff">
          <Use xlinkHref="#a" />
        </Mask>
        <G fill={color} mask="url(#b)">
          <Path d="M0 0h16v16H0z" />
        </G>
      </G>
    </Svg>
  );
}
