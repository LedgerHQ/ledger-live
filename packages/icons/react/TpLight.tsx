import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TpLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.108c5.04 0 9.12-4.08 9.12-9.096 0-5.04-4.08-9.12-9.12-9.12-5.016 0-9.12 4.08-9.12 9.12 0 5.016 4.104 9.096 9.12 9.096zm-6.408-12V8.076h6.432v1.032H9.36v7.32H8.256v-7.32H5.592zm7.488 7.32V8.076h3c1.632 0 2.784 1.104 2.784 2.592s-1.152 2.568-2.784 2.568h-1.896v3.192H13.08zm1.104-4.2h1.968c1.056 0 1.56-.504 1.56-1.44v-.24c0-.96-.504-1.44-1.56-1.44h-1.968v3.12z"  /></Svg>;
}

export default TpLight;