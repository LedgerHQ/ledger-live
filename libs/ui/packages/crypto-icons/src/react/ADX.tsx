import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1B75BC";

function ADX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M8.69 6.452L12 9.905l3.229-3.455L17.25 8.52 13.953 12l3.297 3.452-2.021 2.095L12 14.094l-3.31 3.453-1.94-2.037 3.27-3.53-3.27-3.46 1.94-2.068zm.267-.282L11.986 3l3.03 3.17-1.595 1.698-1.436-1.585-1.435 1.585L8.956 6.17zm0 11.66l1.594-1.698 1.435 1.585 1.436-1.585 1.595 1.698-3.03 3.17-3.03-3.17z"  /></Svg>;
}

ADX.DefaultColor = DefaultColor;
export default ADX;