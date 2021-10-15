import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MedalThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.08 13.704v7.656L12 18.624l4.92 2.736v-7.656a6.634 6.634 0 001.704-4.44c0-3.648-2.976-6.624-6.624-6.624-3.648 0-6.624 2.976-6.624 6.624 0 1.704.648 3.264 1.704 4.44zm-1.224-4.44C5.856 5.88 8.616 3.12 12 3.12c3.384 0 6.144 2.76 6.144 6.144 0 3.384-2.76 6.144-6.144 6.144-3.384 0-6.144-2.76-6.144-6.144zm1.704 11.28V14.16c1.2 1.056 2.736 1.728 4.44 1.728 1.704 0 3.24-.672 4.44-1.728v6.384L12 18.072l-4.44 2.472z"  /></Svg>;
}

export default MedalThin;