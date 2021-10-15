import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ToolboxLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.88 20.04h18.24v-9L18.6 8.52h-1.776V5.736c0-1.008-.768-1.776-1.752-1.776H8.928c-.984 0-1.752.768-1.752 1.776V8.52H5.4l-2.52 2.52v9zm1.176-1.152v-3.672h3.888v1.44h1.152v-1.44h5.808v1.44h1.152v-1.44h3.888v3.672H4.056zm0-4.824v-2.568l1.848-1.848h12.192l1.848 1.848v2.568h-3.888v-1.488h-1.152v1.488H9.096v-1.488H7.944v1.488H4.056zM8.328 8.52V5.76c0-.408.24-.672.648-.672h6.048c.408 0 .672.264.672.672v2.76H8.328z"  /></Svg>;
}

export default ToolboxLight;