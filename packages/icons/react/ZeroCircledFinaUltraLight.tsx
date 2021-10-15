import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledFinaUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.932 16.704c2.28 0 3.456-1.848 3.456-4.68s-1.152-4.68-3.456-4.68c-2.28 0-3.456 1.848-3.456 4.68s1.176 4.68 3.456 4.68zM4.068 21h6.864c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9H4.068v.84h6.864c4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16H4.068V21zm4.248-8.664v-.6c0-2.448.84-3.624 2.616-3.624.96 0 1.656.336 2.064 1.032l-4.44 5.04c-.168-.504-.24-1.128-.24-1.848zm.528 2.544l4.464-5.064c.168.528.24 1.152.24 1.92v.6c0 2.424-.84 3.624-2.616 3.624-.984 0-1.656-.36-2.088-1.08z"  /></Svg>;
}

export default ZeroCircledFinaUltraLight;