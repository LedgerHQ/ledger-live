import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NineCircledFinaLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.836 16.704c2.256 0 3.528-1.872 3.504-4.8-.024-2.856-1.32-4.56-3.504-4.56-1.728 0-3.12 1.32-3.12 3.12 0 1.752 1.272 3.048 2.976 3.048 1.056 0 1.944-.552 2.304-1.416h.144c.072 2.064-.504 3.528-2.328 3.528-1.176 0-1.824-.576-1.968-1.728H7.668c.144 1.704 1.44 2.808 3.168 2.808zm-6.72 4.416h6.648c5.112 0 9.12-4.152 9.12-9.12 0-5.112-4.008-9.12-9.12-9.12H4.116v1.2h6.648c4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92H4.116v1.2zm4.776-10.488v-.408c0-1.128.672-1.8 1.92-1.8h.144c1.272 0 1.92.744 1.92 1.8v.408c0 1.128-.672 1.8-1.92 1.8h-.144c-1.248 0-1.92-.672-1.92-1.8z"  /></Svg>;
}

export default NineCircledFinaLight;