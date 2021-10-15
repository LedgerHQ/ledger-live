import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CheckAloneLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.944 12.816L8.4 19.248 22.056 5.664l-.912-.912L8.4 17.472l-5.544-5.568-.912.912z"  /></Svg>;
}

export default CheckAloneLight;