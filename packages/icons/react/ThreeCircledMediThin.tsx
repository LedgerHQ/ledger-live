import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ThreeCircledMediThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.976 16.68c1.8 0 3.144-1.08 3.144-2.64 0-1.032-.576-1.848-1.872-2.184v-.048c1.248-.336 1.608-1.104 1.608-1.92C14.856 8.4 13.632 7.32 12 7.32c-1.776 0-2.952 1.248-2.952 2.808v.168h.48C9.528 8.76 10.44 7.8 12 7.8c1.44 0 2.376.816 2.376 2.088 0 .96-.432 1.704-2.568 1.704h-.6v.48h.6c2.088 0 2.832.744 2.832 1.968 0 1.32-1.032 2.16-2.664 2.16-1.752 0-2.592-.96-2.592-2.64h-.48v.12c0 1.728 1.104 3 3.072 3zm-6.216 4.2h12.48v-.48H5.76v.48zm0-17.28h12.48v-.48H5.76v.48z"  /></Svg>;
}

export default ThreeCircledMediThin;