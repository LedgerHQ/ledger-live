// @flow
import React from "react";
import Svg, { G, Rect, Path } from "react-native-svg";

type Props = {
  size: number,
};

export default function ReceiveConfirmed({ size = 16 }: Props) {
  return (
    <Svg viewBox="0 0 25 25" width={size} height={size}>
      <G fill="#66BE54" fillRule="nonzero">
        <Rect fillOpacity={0.2} width={24} height={24} rx={12} />
        <Path d="M8.188 17.438c-.277 0-.5-.252-.5-.563 0-.31.223-.563.5-.563h8c.276 0 .5.252.5.563 0 .31-.224.563-.5.563h-8zM11.438 13.83l-2.04-2.04a.563.563 0 0 0-.796.795l2.922 2.922c.1.146.276.243.476.243.2 0 .376-.097.476-.243l2.922-2.922a.563.563 0 0 0-.796-.795l-2.04 2.04V6.896c0-.288-.251-.521-.562-.521-.31 0-.563.233-.562.52v6.935z" />
      </G>
    </Svg>
  );
}
