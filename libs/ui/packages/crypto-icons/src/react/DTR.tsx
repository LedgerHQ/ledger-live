import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#121747";

function DTR({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.535 17.159c0 .858-.69 1.555-1.542 1.555a1.548 1.548 0 01-1.541-1.556V6.816c0-.859.69-1.555 1.541-1.555a1.55 1.55 0 011.542 1.556v10.342zm-5.19.003a1.554 1.554 0 01-.761 1.365 1.524 1.524 0 01-1.551 0 1.554 1.554 0 01-.76-1.365v-2.325a1.554 1.554 0 01.76-1.365 1.523 1.523 0 011.55 0 1.554 1.554 0 01.761 1.365l.001 2.325z"  /><path opacity={0.5} d="M18.728 13.056c0 .859-.69 1.556-1.542 1.556a1.55 1.55 0 01-1.542-1.557V9.131c0-.86.69-1.557 1.542-1.557.852 0 1.542.697 1.542 1.557v3.925z"  /></Svg>;
}

DTR.DefaultColor = DefaultColor;
export default DTR;