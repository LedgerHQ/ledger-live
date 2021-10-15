import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StarLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.64 21.816L12 17.16l6.36 4.656-2.448-7.56 6.408-4.704h-7.944L12 2.184 9.624 9.552H1.68l6.384 4.704-2.424 7.56zm-.672-11.184h5.448L12 5.712l1.584 4.92h5.448l-4.392 3.216 1.656 5.136L12 15.816l-4.32 3.168 1.656-5.136-4.368-3.216z"  /></Svg>;
}

export default StarLight;