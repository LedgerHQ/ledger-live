import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SortMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.312 6.984L7.944 2.64 3.6 6.984 4.8 8.16l1.056-1.056c.384-.384.792-.816 1.176-1.248V20.4h1.824V5.808c.408.456.792.888 1.2 1.296l1.08 1.056 1.176-1.176zm-.624 10.032l4.368 4.344 4.344-4.344-1.2-1.176-1.056 1.056c-.384.384-.792.816-1.176 1.248V3.6h-1.824v14.592c-.408-.456-.792-.888-1.2-1.296l-1.08-1.056-1.176 1.176z"  /></Svg>;
}

export default SortMedium;