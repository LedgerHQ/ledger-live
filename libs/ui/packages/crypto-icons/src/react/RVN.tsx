import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#384182";
function RVN({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M7.123 20.25L9.837 7.658l1.523 9.45zM9.89 7.586l4.123 9.532-2.582-.045zm.062-.072l5.4.767-1.251 8.837zm4.245 9.468l1.217-8.62.797 1.011zM15.334 8.2l-5.27-.75 4.746-1.56zm-5.295-.83l3.23-2.24 1.54.678zm-.08-.027l.623-1.192 2.634-1.056zm.623-1.245l.297-.93 2.17-.073-2.467 1.002m.28-1.003l.7-.75 1.505.678zm.743-.794l1.05-.515 1.358 1.589zm1.2-.452l1.566.686-.28.848zm1.338 1.561l.29-.866.35 1.192zm-1.452-1.66h1.146l.568.632a.036.036 0 01-.017.058.04.04 0 01-.023-.001zm1.812.722l2.332.651a.054.054 0 010 .105l-1.982.544z" clipRule="evenodd" /></Svg>;
}
RVN.DefaultColor = DefaultColor;
export default RVN;