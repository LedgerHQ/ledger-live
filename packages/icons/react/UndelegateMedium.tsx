import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UndelegateMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.436 9.888l12.12 12.12 1.296-1.296-18.72-18.72-1.296 1.296L7.068 8.52C6.372 9.528 5.94 10.728 5.94 12v8.4h1.92V12c0-.816.192-1.512.576-2.112zm1.848-3.528l1.608 1.608h7.104c-.456.408-.888.792-1.296 1.2l-1.056 1.08 1.176 1.176 4.344-4.368-4.344-4.344-1.176 1.2L17.7 4.968c.384.384.816.792 1.248 1.176h-7.104c-.552 0-1.08.072-1.56.216z"  /></Svg>;
}

export default UndelegateMedium;