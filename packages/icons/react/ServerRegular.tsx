import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ServerRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 21.36h7.2V14.4H7.416v-1.704h9.192V14.4H13.68v6.96h7.2V14.4h-2.904v-3.096h-5.28V9.6H15.6V2.64H8.4V9.6h2.904v1.704h-5.28V14.4H3.12v6.96zm1.464-1.392v-4.2h4.272v4.2H4.584zm5.28-11.76v-4.2h4.272v4.2H9.864zm5.28 11.76v-4.2h4.272v4.2h-4.272z"  /></Svg>;
}

export default ServerRegular;