import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SixCircledInitUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.044 16.704c1.8 0 3.072-1.32 3.072-3.096s-1.272-3.096-3-3.096c-1.224 0-2.208.72-2.568 1.776h-.096c-.072-2.28.456-4.176 2.64-4.176 1.248 0 2.016.648 2.208 1.896h.792c-.216-1.632-1.368-2.664-3-2.664-2.208 0-3.48 1.872-3.456 4.8.024 2.856 1.272 4.56 3.408 4.56zM4.068 12c0 5.04 3.96 9 9 9h6.864v-.84h-6.864c-4.56 0-8.16-3.6-8.16-8.16 0-4.464 3.6-8.16 8.16-8.16h6.864V3h-6.864c-5.04 0-9 4.08-9 9zm6.672 1.704v-.216c0-1.344.816-2.208 2.232-2.208h.096c1.416 0 2.232.84 2.232 2.208v.216c0 1.368-.816 2.208-2.232 2.208h-.096c-1.44 0-2.232-.96-2.232-2.208z"  /></Svg>;
}

export default SixCircledInitUltraLight;