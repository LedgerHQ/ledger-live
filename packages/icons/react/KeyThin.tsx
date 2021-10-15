import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function KeyThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.352 20.976l.336-.336-2.736-2.712 2.136-2.136 2.712 2.712.336-.336-2.712-2.712 4.752-4.752a4.4 4.4 0 002.856 1.056A4.353 4.353 0 0020.4 7.392a4.353 4.353 0 00-4.368-4.368 4.353 4.353 0 00-4.368 4.368c0 1.152.432 2.208 1.176 2.976l-9.24 9.24.336.336 1.68-1.68 2.736 2.712zm3.792-13.584a3.872 3.872 0 013.888-3.888 3.872 3.872 0 013.888 3.888 3.872 3.872 0 01-3.888 3.888 3.872 3.872 0 01-3.888-3.888z"  /></Svg>;
}

export default KeyThin;