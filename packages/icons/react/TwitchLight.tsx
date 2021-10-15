import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwitchLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.56 21.792l3.72-3.48h2.928L20.88 12V2.208H6.84l-3.72 3.48v12.624h4.44v3.48zm0-7.704V3.624h11.808v7.704l-2.928 2.76h-2.928l-2.616 2.472v-2.472H7.56zm4.056-3.72h1.488V6.12h-1.488v4.248zm4.056 0h1.488V6.12h-1.488v4.248z"  /></Svg>;
}

export default TwitchLight;