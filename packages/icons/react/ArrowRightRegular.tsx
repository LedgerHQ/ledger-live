import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowRightRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M14.724 18.624L21.372 12l-6.648-6.624-.984.96 3.336 3.312c.528.528 1.104 1.08 1.656 1.608H2.628v1.488h16.104c-.552.528-1.128 1.08-1.656 1.608l-3.336 3.312.984.96z"  /></Svg>;
}

export default ArrowRightRegular;