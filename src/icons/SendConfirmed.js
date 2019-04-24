// @flow
import React from "react";
import Svg, { G, Rect, Path } from "react-native-svg";

type Props = {
  size: number,
};

export default function SendConfirmed({ size = 16 }: Props) {
  return (
    <Svg viewBox="0 0 25 25" width={size} height={size}>
      <G fillRule="nonzero" fill="none">
        <Rect fillOpacity={0.1} fill="#767676" width={24} height={24} rx={12} />
        <Path
          d="M11.438 8.295l-2.04 2.04a.563.563 0 0 1-.796-.795l2.922-2.922A.574.574 0 0 1 12 6.375c.2 0 .376.097.476.243l2.922 2.922a.563.563 0 0 1-.796.795l-2.04-2.04v6.934c0 .288-.251.521-.562.521-.31 0-.563-.233-.563-.52V8.294zm-3.25 9.143c-.277 0-.5-.252-.5-.563 0-.31.223-.563.5-.563h8c.276 0 .5.252.5.563 0 .31-.224.563-.5.563h-8z"
          fill="#999"
        />
      </G>
    </Svg>
  );
}
