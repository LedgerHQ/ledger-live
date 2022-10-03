import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3AB03E";

function CVC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.872 12.584a1.756 1.756 0 00.997-1.58c0-.97-.796-1.757-1.777-1.757-.983 0-1.78.787-1.78 1.757a1.755 1.755 0 001 1.58v2.17h1.56v-2.17zm-.78 5.041c-3.14 0-5.693-2.523-5.693-5.625s2.553-5.625 5.693-5.625a5.694 5.694 0 015.445 3.984h1.962C18.74 7.006 15.713 4.5 12.09 4.5c-4.192 0-7.59 3.358-7.59 7.5 0 4.142 3.398 7.5 7.59 7.5 3.622 0 6.65-2.506 7.408-5.859h-1.963a5.694 5.694 0 01-5.445 3.984"  /></Svg>;
}

CVC.DefaultColor = DefaultColor;
export default CVC;