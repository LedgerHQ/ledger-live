import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LayersUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 12.024l9.6-4.536L12 3 2.4 7.488l9.6 4.536zm-9.6 4.464L12 21l9.6-4.512-2.424-1.176-.84.384 1.488.72L12 20.088l-7.824-3.672 1.488-.72-.816-.384L2.4 16.488zM2.4 12l9.6 4.512L21.6 12l-2.424-1.176-.84.384 1.488.72L12 15.6l-7.824-3.672 1.488-.72-.816-.384L2.4 12zm1.92-4.512L12 3.912l7.68 3.576L12 11.112 4.32 7.488z"  /></Svg>;
}

export default LayersUltraLight;