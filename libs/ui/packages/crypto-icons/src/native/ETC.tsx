import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#0b8311";
function ETC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M12 12.432L6.96 12 12 9.148zm0 3.345v5.205c-1.752-2.728-3.684-5.731-5.241-8.162 1.837 1.035 3.756 2.117 5.241 2.958m0-7.55L6.76 11.15 12 3.018zM17.041 12l-5.04.432V9.148zm-5.04 3.778c1.485-.84 3.402-1.923 5.24-2.958-1.556 2.432-3.488 5.435-5.24 8.162zm0-7.552V3.018l5.24 8.133z" /><Path  fillRule="evenodd" d="M12 12.432L17.04 12 12 14.83z" clipRule="evenodd" opacity={0.2} /><Path  fillRule="evenodd" d="M12 12.432L6.959 12l5.04 2.83z" clipRule="evenodd" opacity={0.603} /></Svg>;
}
ETC.DefaultColor = DefaultColor;
export default ETC;