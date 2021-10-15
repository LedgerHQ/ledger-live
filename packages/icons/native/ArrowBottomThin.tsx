import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowBottomThin({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 21.372l6.624-6.624-.336-.336-3.168 3.168-2.88 2.88V2.628h-.48V20.46l-2.88-2.88-3.168-3.168-.336.336L12 21.372z"  /></Svg>;
}

export default ArrowBottomThin;