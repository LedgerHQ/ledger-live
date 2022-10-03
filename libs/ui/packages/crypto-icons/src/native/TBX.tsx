import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";

function TBX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M11.775 20.55A8.775 8.775 0 013 11.775 8.775 8.775 0 0111.775 3a8.775 8.775 0 018.775 8.775 8.775 8.775 0 01-8.775 8.775zm2.168-5.775l-2.168-3-2.168 3-1.762-3 1.965-3.36h3.93l1.965 3.36-1.762 3zm.645-7.8H8.963l-2.805 4.8 2.812 4.8h5.617l2.805-4.8-2.804-4.8z"  /><Path d="M12 20.775A8.775 8.775 0 013.225 12 8.775 8.775 0 0112 3.225 8.775 8.775 0 0120.775 12 8.775 8.775 0 0112 20.775zM14.168 15L12 12l-2.167 3-1.763-3 1.965-3.36h3.93L15.93 12l-1.762 3zm.645-7.8H9.188L6.383 12l2.812 4.8h5.617l2.806-4.8-2.805-4.8z"  /></Svg>;
}

TBX.DefaultColor = DefaultColor;
export default TBX;