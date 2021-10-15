import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledMediThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.6 11.904v4.56h.48v-8.88h-1.272l-3.264 3.048v.648L12 8.064h.6v3.84zM5.76 20.88h12.48v-.48H5.76v.48zm0-17.28h12.48v-.48H5.76v.48z"  /></Svg>;
}

export default OneCircledMediThin;