import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ManagerLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.2 19.848V14.28h5.52v5.568H4.2zM3 21h7.92v-7.872H3V21zm0-10.152h7.92V3H3v7.848zM4.2 9.72V4.128h5.52V9.72H4.2zM13.08 21H21v-7.872h-7.92V21zm0-10.128H21V3h-7.92v7.872zm1.2 8.976V14.28h5.52v5.568h-5.52zm0-10.128V4.152h5.52V9.72h-5.52z"  /></Svg>;
}

export default ManagerLight;