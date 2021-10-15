import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LayersMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 12.384l10.32-4.896L12 2.64 1.68 7.488 12 12.384zM1.68 16.488L12 21.36l10.32-4.872-2.16-1.032-8.16 3.84-8.16-3.84-2.16 1.032zm0-4.488L12 16.896 22.32 12l-2.16-1.032-8.16 3.84-8.16-3.84L1.68 12zM6 7.488l6-2.808 6 2.808-6 2.856-6-2.856z"  /></Svg>;
}

export default LayersMedium;