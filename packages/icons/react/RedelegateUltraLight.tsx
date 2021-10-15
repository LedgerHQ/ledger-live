import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RedelegateUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 8.184V12h.816V8.184c0-.792.84-1.68 1.68-1.68h15.72c-.6.576-1.176 1.152-1.752 1.728l-1.68 1.656.552.552 4.344-4.344-4.344-4.344-.552.552 1.68 1.656c.552.576 1.152 1.152 1.728 1.728H5.136c-1.248 0-2.496 1.296-2.496 2.496zm-.96 9.72l4.344 4.344.552-.552-1.68-1.68a116.5 116.5 0 00-1.728-1.704h15.696c1.248 0 2.496-1.32 2.496-2.496V12h-.816v3.816c0 .792-.84 1.68-1.68 1.68H3.168c.576-.576 1.176-1.152 1.728-1.728l1.68-1.68-.552-.528-4.344 4.344z"  /></Svg>;
}

export default RedelegateUltraLight;