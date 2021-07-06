// @flow

import React from "react";
import Svg, { Rect, Mask } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

const Apps = ({ size = 16, color }: Props) => (
  <Svg viewBox="0 0 16 16" height={size} width={size} fill="none">
    <Mask id="path-1-inside-1" fill="white">
      <Rect x="0.727264" y="0.727295" width="6.54545" height="6.54545" rx="1" />
    </Mask>
    <Rect
      x="0.727264"
      y="0.727295"
      width="6.54545"
      height="6.54545"
      rx="1"
      stroke={color}
      strokeWidth="3"
      mask="url(#path-1-inside-1)"
    />
    <Mask id="path-2-inside-2" fill="white">
      <Rect x="0.727264" y="8.72729" width="6.54545" height="6.54545" rx="1" />
    </Mask>
    <Rect
      x="0.727264"
      y="8.72729"
      width="6.54545"
      height="6.54545"
      rx="1"
      stroke={color}
      strokeWidth="3"
      mask="url(#path-2-inside-2)"
    />
    <Mask id="path-3-inside-3" fill="white">
      <Rect x="8.72726" y="0.727295" width="6.54545" height="6.54545" rx="1" />
    </Mask>
    <Rect
      x="8.72726"
      y="0.727295"
      width="6.54545"
      height="6.54545"
      rx="1"
      stroke={color}
      strokeWidth="3"
      mask="url(#path-3-inside-3)"
    />
    <Mask id="path-4-inside-4" fill="white">
      <Rect x="8.72726" y="8.72729" width="6.54545" height="6.54545" rx="1" />
    </Mask>
    <Rect
      x="8.72726"
      y="8.72729"
      width="6.54545"
      height="6.54545"
      rx="1"
      stroke={color}
      strokeWidth="3"
      mask="url(#path-4-inside-4)"
    />
  </Svg>
);

export default Apps;
