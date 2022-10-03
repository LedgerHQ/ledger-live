import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#2AB6F6";

function LRC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M12 4.5l6.75 9.4L12 19.5l-6.75-5.6L12 4.5zm-.88 5l-2.935 4 2.934 2.4V9.5zm1.76 0v6.4l2.935-2.4-2.934-4z"  /></Svg>;
}

LRC.DefaultColor = DefaultColor;
export default LRC;