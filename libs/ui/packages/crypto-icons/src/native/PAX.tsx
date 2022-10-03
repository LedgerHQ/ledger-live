import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#EDE708";

function PAX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M19.587 9.973l.375.563c.75-1.89.577-3.368-.098-4.013-1.215-1.17-3-.517-4.935-1.327-1.612-1.185-2.587-1.5-3.93-1.5a4.665 4.665 0 00-2.437 1.23 3.75 3.75 0 00-2.925 1.147c-.795.938-.975 3.51-1.095 4.163-.12.652-1.5 3.285-1.358 4.725.143 1.44 1.2 3 4.193 3.367a5.685 5.685 0 004.5 1.973c1.567-.165 3.75-2.565 5.017-3.518 1.268-.952 5.783-1.777 3.09-6.21a6.687 6.687 0 00-.375-.562l-.022-.038zm-6.848 6.6a4.995 4.995 0 01-5.587-3.045c-.165-.645-.488-3.93 2.25-5.557 2.04-1.155 4.912-1.313 6.12 1.38 1.207 2.692.765 6.465-2.783 7.222z"  /></Svg>;
}

PAX.DefaultColor = DefaultColor;
export default PAX;