import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#0B8311";

function ETC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 12.432L6.96 12 12 9.148v3.284zm0 3.345v5.205c-1.752-2.728-3.684-5.731-5.241-8.162 1.837 1.035 3.756 2.117 5.241 2.958zm0-7.55L6.76 11.15 12 3.018v5.208zM17.041 12l-5.04.432V9.148L17.04 12zm-5.04 3.778c1.485-.84 3.402-1.923 5.24-2.958-1.556 2.432-3.489 5.435-5.24 8.162v-5.204zm0-7.552V3.018l5.24 8.133-5.24-2.925z"  /><path opacity={0.2} fillRule="evenodd" clipRule="evenodd" d="M12 12.432L17.04 12 12 14.83v-2.398z"  /><path opacity={0.603} fillRule="evenodd" clipRule="evenodd" d="M12 12.432L6.959 12l5.04 2.83v-2.398z"  /></Svg>;
}

ETC.DefaultColor = DefaultColor;
export default ETC;