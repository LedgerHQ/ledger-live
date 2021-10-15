import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NoneLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.12c5.112 0 9.12-4.152 9.12-9.12 0-5.088-4.032-9.12-9.12-9.12-5.088 0-9.12 4.032-9.12 9.12 0 5.088 4.032 9.12 9.12 9.12zM4.08 12c0-4.44 3.48-7.92 7.92-7.92 1.992 0 3.792.696 5.184 1.872L5.952 17.184C4.776 15.792 4.08 13.992 4.08 12zm2.736 6.048L18.048 6.816C19.224 8.208 19.92 10.008 19.92 12c0 4.32-3.48 7.92-7.92 7.92-1.992 0-3.792-.696-5.184-1.872z"  /></Svg>;
}

export default NoneLight;