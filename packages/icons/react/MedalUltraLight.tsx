import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MedalUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.02 13.728v7.752l4.968-2.784 4.992 2.784v-7.752c1.056-1.2 1.728-2.784 1.728-4.512 0-3.672-3.024-6.696-6.72-6.696-3.696 0-6.696 3.024-6.696 6.696 0 1.728.648 3.312 1.728 4.512zm-.888-4.512C6.132 6 8.748 3.36 11.988 3.36c3.24 0 5.88 2.64 5.88 5.856a5.89 5.89 0 01-5.88 5.88c-3.24 0-5.856-2.64-5.856-5.88zm1.68 10.92v-5.712c1.152.936 2.592 1.512 4.176 1.512s3.024-.576 4.176-1.512v5.712l-4.176-2.328-4.176 2.328z"  /></Svg>;
}

export default MedalUltraLight;