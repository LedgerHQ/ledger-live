// @flow
import React from "react";
import Svg, { G, Path } from "react-native-svg";

type Props = {
  size: number,
};

export default function SendConfirmed({ size = 16 }: Props) {
  return (
    <Svg viewBox="0 0 28 28" width={size} height={size}>
      <G fill="#EA2E49" fillRule="nonzero">
        <Path d="M14 2c6.627 0 12 5.373 12 12s-5.373 12-12 12S2 20.627 2 14 7.373 2 14 2zm0 1C7.925 3 3 7.925 3 14s4.925 11 11 11 11-4.925 11-11S20.075 3 14 3z" />
        <Path
          fillOpacity=".05"
          d="M14 3C7.925 3 3 7.925 3 14s4.925 11 11 11 11-4.925 11-11S20.075 3 14 3z"
        />
        <Path d="M13.438 10.295l-2.04 2.04a.563.563 0 0 1-.796-.795l2.922-2.922A.574.574 0 0 1 14 8.375c.2 0 .376.097.476.243l2.922 2.922a.563.563 0 0 1-.796.795l-2.04-2.04v6.934c0 .288-.251.521-.562.521-.31 0-.563-.233-.563-.52v-6.935zm-3.25 9.143c-.277 0-.5-.252-.5-.563 0-.31.223-.563.5-.563h8c.276 0 .5.252.5.563 0 .31-.224.563-.5.563h-8z" />
      </G>
    </Svg>
  );
}
