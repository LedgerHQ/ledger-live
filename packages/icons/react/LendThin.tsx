import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LendThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.36 14.16v.48c6.792-.96 12.456-4.992 16.8-10.704v5.352h.48V3.12h-6.144v.48H19.8c-4.272 5.64-9.768 9.6-16.44 10.56zm0 6.72h.48v-2.928h-.48v2.928zm4.2 0h.48v-4.272h-.48v4.272zm4.2 0h.48v-5.688h-.48v5.688zm4.2 0h.48v-7.056h-.48v7.056zm4.2 0h.48v-8.4h-.48v8.4z"  /></Svg>;
}

export default LendThin;