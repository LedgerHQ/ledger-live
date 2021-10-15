import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StarRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.64 21.816L12 17.16l6.36 4.656-2.448-7.56 6.408-4.704h-7.944L12 2.184 9.624 9.552H1.68l6.384 4.704-2.424 7.56zm.24-10.896h4.752L12 6.672l1.368 4.248h4.752l-3.816 2.808 1.44 4.464L12 15.456l-3.744 2.736 1.416-4.464L5.88 10.92z"  /></Svg>;
}

export default StarRegular;