import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFastUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.26 19.572h15.456c1.128-1.536 1.848-3.504 1.848-5.568 0-2.016-.648-3.864-1.704-5.424l-.6.624a8.65 8.65 0 011.464 4.8c0 1.728-.552 3.36-1.44 4.728H4.692a8.689 8.689 0 01-1.416-4.728c0-4.824 3.912-8.736 8.712-8.736a8.65 8.65 0 014.8 1.464l.624-.6c-1.56-1.056-3.408-1.704-5.424-1.704-5.28 0-9.552 4.296-9.552 9.576 0 2.064.696 4.032 1.824 5.568zm7.32-5.568c0 .24.168.408.408.408.12 0 .216-.024.288-.12l6.792-6.768-.6-.6-6.768 6.792c-.096.072-.12.168-.12.288z"  /></Svg>;
}

export default TachometerFastUltraLight;