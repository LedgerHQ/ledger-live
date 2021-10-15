import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledMediUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 16.704c2.28 0 3.456-1.848 3.456-4.68S14.304 7.344 12 7.344c-2.28 0-3.456 1.848-3.456 4.68s1.176 4.68 3.456 4.68zM5.76 21h12.48v-.84H5.76V21zm0-17.16h12.48V3H5.76v.84zm3.624 8.496v-.6c0-2.448.84-3.624 2.616-3.624.96 0 1.656.336 2.064 1.032l-4.44 5.04c-.168-.504-.24-1.128-.24-1.848zm.528 2.544l4.464-5.064c.168.528.24 1.152.24 1.92v.6c0 2.424-.84 3.624-2.616 3.624-.984 0-1.656-.36-2.088-1.08z"  /></Svg>;
}

export default ZeroCircledMediUltraLight;