import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DevicesLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.64 21.36h6.792v-1.152H5.736c-.408 0-.696-.264-.696-.672V4.464c0-.408.288-.696.696-.696h9.792c.408 0 .672.288.672.696v2.304h1.2V4.44c0-.984-.816-1.8-1.8-1.8H5.64c-.984 0-1.8.816-1.8 1.8v15.12c0 .984.816 1.8 1.8 1.8zm8.64 0h5.88V8.64h-5.88v12.72zm1.152-1.152V9.768h3.6v10.44h-3.6z"  /></Svg>;
}

export default DevicesLight;