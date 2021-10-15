import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledFinaLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.764 16.704c2.352 0 3.576-1.848 3.576-4.68 0-2.856-1.2-4.68-3.576-4.68-2.328 0-3.576 1.848-3.576 4.68s1.248 4.68 3.576 4.68zM4.116 21.12h6.648c5.112 0 9.12-4.152 9.12-9.12 0-5.112-4.008-9.12-9.12-9.12H4.116v1.2h6.648c4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92H4.116v1.2zm4.32-8.52v-1.128c0-2.184.72-3.096 2.328-3.096.888 0 1.488.264 1.872.888l-4.08 4.632a6.81 6.81 0 01-.12-1.296zm.432 2.184l4.104-4.632c.072.36.12.816.12 1.32V12.6c0 2.184-.72 3.072-2.328 3.072-.888 0-1.512-.264-1.896-.888z"  /></Svg>;
}

export default ZeroCircledFinaLight;