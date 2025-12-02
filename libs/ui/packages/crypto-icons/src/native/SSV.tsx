import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1ba5f8";
function SSV({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M8.804 18.126l2.656-3.275a.693.693 0 011.077 0l2.657 3.275a.69.69 0 010 .873l-2.657 3.275a.693.693 0 01-1.077 0l-2.656-3.275a.69.69 0 010-.873m2.656-16.4L8.804 5.001a.694.694 0 000 .873L11.46 9.15c.278.342.8.342 1.077 0l2.657-3.275a.69.69 0 000-.873l-2.657-3.275a.693.693 0 00-1.077 0m-6.806 8.392l2.657-3.274a.693.693 0 011.077 0l2.656 3.274a.69.69 0 010 .874l-2.656 3.275a.693.693 0 01-1.077 0l-2.657-3.275a.69.69 0 010-.874m8.302 0l2.656-3.274a.693.693 0 011.077 0l2.657 3.274a.69.69 0 010 .874l-2.657 3.275a.693.693 0 01-1.077 0l-2.656-3.275a.69.69 0 010-.874" /></Svg>;
}
SSV.DefaultColor = DefaultColor;
export default SSV;