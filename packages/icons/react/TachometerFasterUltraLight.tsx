import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFasterUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.248 19.572h15.456c.768-1.056 1.416-2.448 1.656-3.84h-.864c-.192 1.08-.648 2.112-1.224 3H4.68a8.689 8.689 0 01-1.416-4.728c0-4.824 3.912-8.736 8.712-8.736 4.224 0 7.728 3.024 8.52 7.008h.864c-.816-4.464-4.704-7.848-9.384-7.848-5.28 0-9.552 4.296-9.552 9.576 0 2.064.696 4.032 1.824 5.568zm7.32-5.568c0 .24.168.408.408.408h9.6v-.84h-9.6c-.24 0-.408.192-.408.432z"  /></Svg>;
}

export default TachometerFasterUltraLight;