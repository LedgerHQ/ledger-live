import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledInitMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.464 12.408v.696h-2.232l2.256-3.408h.024c-.024.792-.048 1.8-.048 2.712zM4.2 12c0 5.232 4.128 9.36 9.36 9.36h6.24v-1.92h-6.24c-4.176 0-7.44-3.264-7.44-7.44 0-4.056 3.264-7.44 7.44-7.44h6.24V2.64h-6.24C8.304 2.64 4.2 6.912 4.2 12zm5.256 2.664h4.008v1.8h1.8v-1.8h1.368v-1.56h-1.368v-5.52h-2.016l-3.792 5.712v1.368z"  /></Svg>;
}

export default FourCircledInitMedium;