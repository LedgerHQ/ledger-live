import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledMediLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 16.704c2.352 0 3.576-1.848 3.576-4.68 0-2.856-1.2-4.68-3.576-4.68-2.328 0-3.576 1.848-3.576 4.68s1.248 4.68 3.576 4.68zM5.76 21.12h12.48v-1.2H5.76v1.2zm0-17.04h12.48v-1.2H5.76v1.2zm3.912 8.52v-1.128c0-2.184.72-3.096 2.328-3.096.888 0 1.488.264 1.872.888l-4.08 4.632a6.81 6.81 0 01-.12-1.296zm.432 2.184l4.104-4.632c.072.36.12.816.12 1.32V12.6c0 2.184-.72 3.072-2.328 3.072-.888 0-1.512-.264-1.896-.888z"  /></Svg>;
}

export default ZeroCircledMediLight;