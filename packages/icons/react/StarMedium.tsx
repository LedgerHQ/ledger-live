import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StarMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.64 21.816L12 17.16l6.36 4.656-2.448-7.56 6.408-4.704h-7.944L12 2.184 9.624 9.552H1.68l6.384 4.704-2.424 7.56zm1.152-10.584h4.056L12 7.656l1.152 3.576h4.032l-3.24 2.376 1.224 3.792L12 15.072 8.808 17.4l1.224-3.792-3.24-2.376z"  /></Svg>;
}

export default StarMedium;