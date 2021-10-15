import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LayersThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 11.904l9.36-4.416L12 3.12 2.64 7.488 12 11.904zm-9.36 4.584L12 20.88l9.36-4.392-2.16-1.032-.576.264 1.608.768L12 20.352l-8.232-3.864 1.608-.768-.576-.264-2.16 1.032zm0-4.488L12 16.392 21.36 12l-2.16-1.032-.576.264 1.608.768L12 15.864 3.768 12l1.608-.768-.576-.264L2.64 12zm1.128-4.512L12 3.648l8.232 3.84L12 11.376 3.768 7.488z"  /></Svg>;
}

export default LayersThin;