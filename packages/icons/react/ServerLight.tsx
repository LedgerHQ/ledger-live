import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ServerLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 21.36h7.2V14.4H7.248v-1.872h9.504V14.4H13.68v6.96h7.2V14.4h-3.048v-2.952h-5.28V9.6H15.6V2.64H8.4V9.6h3.072v1.848H6.168V14.4H3.12v6.96zm1.152-1.08v-4.8h4.92v4.8h-4.92zm5.28-11.76v-4.8h4.92v4.8h-4.92zm5.28 11.76v-4.8h4.92v4.8h-4.92z"  /></Svg>;
}

export default ServerLight;