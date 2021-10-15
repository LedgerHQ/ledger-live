import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LayersLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 12.144l9.84-4.656L12 2.88 2.16 7.488 12 12.144zm-9.84 4.344L12 21.12l9.84-4.632-1.344-.648L12 19.824 3.528 15.84l-1.368.648zm0-4.488L12 16.632 21.84 12l-1.344-.648L12 15.336l-8.472-3.984L2.16 12zm2.736-4.512L12 4.176l7.104 3.312L12 10.848l-7.104-3.36z"  /></Svg>;
}

export default LayersLight;