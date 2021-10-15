import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UndelegateThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.1 8.832l12.696 12.696.336-.336-18.72-18.72-.336.336 5.688 5.688A5.22 5.22 0 006.42 12v8.4h.48V12c0-1.224.432-2.304 1.2-3.168zm2.472-1.944l.432.432c.192-.024.408-.024.6-.024h9.408l-1.896 1.896-1.872 1.872.336.336 4.344-4.344-4.344-4.344-.336.336 1.872 1.872 1.896 1.896h-9.408c-.36 0-.696.024-1.032.072z"  /></Svg>;
}

export default UndelegateThin;