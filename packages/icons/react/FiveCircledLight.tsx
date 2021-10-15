import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.12c5.112 0 9.12-4.152 9.12-9.12 0-5.088-4.032-9.12-9.12-9.12-5.088 0-9.12 4.032-9.12 9.12 0 5.088 4.032 9.12 9.12 9.12zM4.08 12c0-4.44 3.48-7.92 7.92-7.92 4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92-4.44 0-7.92-3.48-7.92-7.92zm4.68 1.752c0 1.656 1.32 2.952 3.24 2.952 1.92 0 3.216-1.32 3.216-3.096 0-1.752-1.248-3.072-2.976-3.072-.792 0-1.44.312-1.872.84H10.2l.336-2.736h4.152V7.584H9.576l-.48 5.16h1.08c.264-.744.816-1.152 1.8-1.152h.096c1.272 0 1.944.624 1.944 1.824v.36c0 1.224-.624 1.848-1.968 1.848h-.096c-1.368 0-1.968-.672-1.992-1.872h-1.2z"  /></Svg>;
}

export default FiveCircledLight;