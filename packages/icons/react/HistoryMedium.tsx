import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HistoryMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.36c5.136 0 9.36-4.224 9.36-9.36 0-5.136-4.224-9.36-9.36-9.36-2.712 0-5.088 1.128-6.792 3.072.024-.528.048-1.056.048-1.56V2.64h-1.68v6.144H9.12v-1.68h-.912c-.624 0-1.296.024-1.92.072C7.632 5.568 9.648 4.56 12 4.56c4.08 0 7.44 3.36 7.44 7.44s-3.36 7.44-7.44 7.44S4.56 16.08 4.56 12H2.64c0 5.136 4.224 9.36 9.36 9.36zM11.064 12c0 .264.12.504.288.672l3.456 3.456 1.344-1.344-3.168-3.192V6.48h-1.92V12z"  /></Svg>;
}

export default HistoryMedium;