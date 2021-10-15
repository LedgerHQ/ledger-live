import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledFinaLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.764 16.704c1.92 0 3.216-1.32 3.216-3.096 0-1.752-1.248-3.072-2.976-3.072-.792 0-1.44.312-1.872.84h-.144L9.3 8.64h4.152V7.584H8.34l-.48 5.16h1.08c.264-.744.816-1.152 1.8-1.152h.096c1.272 0 1.944.624 1.944 1.824v.36c0 1.224-.624 1.848-1.968 1.848h-.096c-1.368 0-1.968-.672-1.992-1.872h-1.2c0 1.656 1.32 2.952 3.24 2.952zM4.116 21.12h6.648c5.112 0 9.12-4.152 9.12-9.12 0-5.112-4.008-9.12-9.12-9.12H4.116v1.2h6.648c4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92H4.116v1.2z"  /></Svg>;
}

export default FiveCircledFinaLight;