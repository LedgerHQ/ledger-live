import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SixCircledFinaUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.908 16.704c1.8 0 3.072-1.32 3.072-3.096s-1.272-3.096-3-3.096c-1.224 0-2.208.72-2.568 1.776H8.34c-.096-2.28.432-4.176 2.616-4.176 1.248 0 2.016.648 2.208 1.896h.792c-.216-1.608-1.368-2.664-3-2.664-2.208 0-3.48 1.872-3.456 4.8.024 2.856 1.272 4.56 3.408 4.56zM4.068 21h6.864c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9H4.068v.84h6.864c4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16H4.068V21zm4.536-7.296v-.216c0-1.344.816-2.208 2.232-2.208h.096c1.416 0 2.232.84 2.232 2.208v.216c0 1.368-.816 2.208-2.232 2.208h-.096c-1.44 0-2.232-.96-2.232-2.208z"  /></Svg>;
}

export default SixCircledFinaUltraLight;