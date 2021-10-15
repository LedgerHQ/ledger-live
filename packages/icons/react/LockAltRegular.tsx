import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LockAltRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.22 17.496h1.56v-4.08h-1.56v4.08zm-6.528 3.84h14.616V9.624H17.34V7.92c0-2.904-2.448-5.256-5.352-5.256-2.904 0-5.328 2.352-5.328 5.256v1.704H4.692v11.712zm1.56-1.464v-8.76h11.496v8.76H6.252zM8.22 9.624V7.92a3.774 3.774 0 013.768-3.768c2.088 0 3.792 1.704 3.792 3.768v1.704H8.22z"  /></Svg>;
}

export default LockAltRegular;