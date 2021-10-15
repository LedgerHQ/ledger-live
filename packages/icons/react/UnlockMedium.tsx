import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UnlockMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.544 21.36H22.32V9.6h-9.744V7.968c0-2.976-2.496-5.328-5.448-5.328-2.952 0-5.448 2.352-5.448 5.328V11.4H3.6V7.968c0-1.92 1.584-3.528 3.528-3.528s3.528 1.608 3.528 3.528V9.6H8.544v11.76zm1.92-1.8V11.4H20.4v8.16h-9.936zm4.008-2.04h1.92v-4.08h-1.92v4.08z"  /></Svg>;
}

export default UnlockMedium;