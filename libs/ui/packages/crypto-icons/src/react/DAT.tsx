import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#2d9cdb";
function DAT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M16.31 4.464q.443 0 .71.27.27.268.27.71v8.755q0 1.497-.71 2.726a5.16 5.16 0 01-1.901 1.92q-1.19.69-2.67.691-1.477 0-2.707-.69a5.16 5.16 0 01-1.9-1.92q-.691-1.23-.691-2.727t.633-2.707q.652-1.23 1.767-1.92a4.74 4.74 0 012.514-.692 4.73 4.73 0 013.706 1.748V5.444q0-.442.27-.71a1 1 0 01.71-.27m-4.3 13.344q.96 0 1.727-.46a3.35 3.35 0 001.23-1.305 3.86 3.86 0 00.441-1.844q0-1.018-.442-1.824a3.2 3.2 0 00-1.229-1.287 3.2 3.2 0 00-1.728-.48q-.96 0-1.747.48c-.517.312-.94.757-1.229 1.287q-.44.805-.44 1.824 0 1.017.44 1.843a3.56 3.56 0 001.23 1.306q.787.46 1.747.46" /></Svg>;
}
DAT.DefaultColor = DefaultColor;
export default DAT;