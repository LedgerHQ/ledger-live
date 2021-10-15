import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledInitUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.068 16.704c2.28 0 3.456-1.848 3.456-4.68s-1.152-4.68-3.456-4.68c-2.28 0-3.456 1.848-3.456 4.68s1.176 4.68 3.456 4.68zm-9-4.704c0 5.04 3.96 9 9 9h6.864v-.84h-6.864c-4.56 0-8.16-3.6-8.16-8.16 0-4.464 3.6-8.16 8.16-8.16h6.864V3h-6.864c-5.04 0-9 4.08-9 9zm6.384.336v-.6c0-2.448.84-3.624 2.616-3.624.96 0 1.656.336 2.064 1.032l-4.44 5.04c-.168-.504-.24-1.128-.24-1.848zm.528 2.52l4.464-5.064c.168.528.24 1.176.24 1.944v.6c0 2.424-.84 3.624-2.616 3.624-.984 0-1.68-.36-2.088-1.104z"  /></Svg>;
}

export default ZeroCircledInitUltraLight;