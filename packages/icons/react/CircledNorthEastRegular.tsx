import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledNorthEastRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.024 16.032l5.448-5.448c-.024.696-.048 1.368-.048 2.04v1.752h1.368V8.208H9.648v1.368h1.728c.648 0 1.344 0 2.016-.024l-5.424 5.424 1.056 1.056zM2.76 12c0 5.16 4.08 9.24 9.24 9.24 5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12zm1.56 0c0-4.32 3.384-7.68 7.68-7.68 4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68-4.296 0-7.68-3.384-7.68-7.68z"  /></Svg>;
}

export default CircledNorthEastRegular;