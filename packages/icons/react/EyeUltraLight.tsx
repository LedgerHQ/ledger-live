import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EyeUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 19.152c3.72 0 7.704-3.072 9.6-7.152-1.896-4.08-5.88-7.152-9.6-7.152-3.72 0-7.704 3.072-9.6 7.152 1.896 4.08 5.88 7.152 9.6 7.152zM3.336 12C5.184 8.28 8.688 5.64 12 5.64c3.312 0 6.816 2.64 8.664 6.36-1.848 3.72-5.352 6.336-8.664 6.336-3.312 0-6.816-2.616-8.664-6.336zm5.424 0c0 1.8 1.44 3.24 3.24 3.24 1.8 0 3.24-1.44 3.24-3.24 0-1.8-1.44-3.24-3.24-3.24-1.8 0-3.24 1.44-3.24 3.24zm.792 0c0-1.368 1.08-2.472 2.448-2.472A2.468 2.468 0 0114.472 12c0 1.368-1.104 2.448-2.472 2.448A2.428 2.428 0 019.552 12z"  /></Svg>;
}

export default EyeUltraLight;