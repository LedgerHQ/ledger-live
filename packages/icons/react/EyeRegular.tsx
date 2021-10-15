import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EyeRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 19.512c3.888 0 8.088-3.216 10.08-7.512C20.088 7.704 15.888 4.488 12 4.488S3.912 7.704 1.92 12c1.992 4.296 6.192 7.512 10.08 7.512zM3.648 12C5.544 8.352 8.832 5.952 12 5.952s6.456 2.4 8.352 6.048c-1.896 3.648-5.184 6.024-8.352 6.024S5.544 15.648 3.648 12zm4.872 0c0 1.92 1.56 3.48 3.48 3.48s3.48-1.56 3.48-3.48S13.92 8.52 12 8.52 8.52 10.08 8.52 12zm1.392 0c0-1.152.936-2.112 2.088-2.112A2.13 2.13 0 0114.112 12c0 1.152-.96 2.088-2.112 2.088A2.09 2.09 0 019.912 12z"  /></Svg>;
}

export default EyeRegular;