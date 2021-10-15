import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CommentsLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 4.884v12.408l4.128-3.168H17.64v-9.24c0-.984-.816-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8zm1.2 10.032V4.908c0-.384.312-.696.696-.696h11.232c.36 0 .672.312.672.696v8.064H6.36l-2.52 1.944zm3.84 1.008c0 .984.816 1.8 1.8 1.8h7.728l4.152 3.192V8.724c0-.984-.84-1.848-1.848-1.848v1.2c.36 0 .648.36.648.888v9.552l-2.52-1.944H9.792c-.6 0-.912-.288-.912-.648h-1.2z"  /></Svg>;
}

export default CommentsLight;