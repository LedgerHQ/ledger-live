import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3ab03e";
function CVC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M12.872 12.584a1.76 1.76 0 00.997-1.58c0-.97-.796-1.757-1.777-1.757-.983 0-1.78.787-1.78 1.757a1.76 1.76 0 001 1.58v2.17h1.56zm-.78 5.041c-3.14 0-5.693-2.523-5.693-5.625s2.553-5.625 5.693-5.625a5.69 5.69 0 015.445 3.984h1.962C18.74 7.007 15.713 4.5 12.09 4.5 7.898 4.5 4.5 7.858 4.5 12s3.398 7.5 7.59 7.5c3.622 0 6.65-2.506 7.408-5.859h-1.963a5.69 5.69 0 01-5.445 3.984" /></Svg>;
}
CVC.DefaultColor = DefaultColor;
export default CVC;