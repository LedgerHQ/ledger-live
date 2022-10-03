import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#2A5ADA";

function LINK({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 4.5l-1.35.791L6.976 7.46l-1.35.791v7.5l1.35.791 3.71 2.168 1.349.791 1.349-.791 3.643-2.168 1.349-.791v-7.5l-1.35-.791L13.35 5.29 12 4.5zm-3.677 9.668V9.832L12 7.664l3.677 2.167v4.335L12 16.335l-3.677-2.168z"  /></Svg>;
}

LINK.DefaultColor = DefaultColor;
export default LINK;