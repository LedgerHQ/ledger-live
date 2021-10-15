import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SortLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12.312 6.984L7.944 2.64 3.6 6.984l.768.744 1.464-1.464a94.84 94.84 0 001.536-1.56V20.4H8.52V4.68c.528.528 1.032 1.08 1.56 1.584l1.464 1.464.768-.744zm-.6 10.032l4.344 4.344 4.344-4.344-.768-.768-1.464 1.464a97.129 97.129 0 00-1.536 1.584V3.6H15.48v15.72c-.504-.552-1.032-1.08-1.536-1.608l-1.488-1.464-.744.768z"  /></Svg>;
}

export default SortLight;