import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NineCircledInitLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.308 16.704c2.256 0 3.528-1.872 3.504-4.8-.024-2.856-1.32-4.56-3.504-4.56-1.728 0-3.12 1.32-3.12 3.12 0 1.752 1.272 3.048 2.976 3.048 1.056 0 1.944-.528 2.304-1.416h.144c.072 2.064-.504 3.528-2.328 3.528-1.176 0-1.848-.576-1.968-1.728h-1.2c.168 1.704 1.464 2.808 3.192 2.808zM4.116 12c0 5.088 4.032 9.12 9.12 9.12h6.648v-1.2h-6.648c-4.44 0-7.92-3.48-7.92-7.92 0-4.32 3.48-7.92 7.92-7.92h6.648v-1.2h-6.648c-5.112 0-9.12 4.152-9.12 9.12zm7.248-1.368v-.408c0-1.128.672-1.8 1.92-1.8h.144c1.272 0 1.92.744 1.92 1.8v.408c0 1.128-.672 1.8-1.92 1.8h-.144c-1.248 0-1.92-.672-1.92-1.8z"  /></Svg>;
}

export default NineCircledInitLight;