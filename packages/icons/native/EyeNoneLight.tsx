import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EyeNoneLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M20.952 21.768l.816-.816-18.72-18.72-.816.816L6.144 6.96A13.74 13.74 0 002.16 12c1.944 4.176 6.048 7.32 9.84 7.32 1.656 0 3.36-.576 4.896-1.608l4.056 4.056zM3.432 12A12.366 12.366 0 016.96 7.776l2.28 2.28c-.36.552-.6 1.224-.6 1.944A3.37 3.37 0 0012 15.36c.696 0 1.392-.24 1.92-.624l2.16 2.16c-1.344.84-2.688 1.296-4.08 1.296-3.288 0-6.696-2.52-8.568-6.192zm5.76-6.816l.888.912A6.776 6.776 0 0112 5.808c3.264 0 6.648 2.496 8.52 6.192a13.238 13.238 0 01-1.824 2.688l.816.816A14.372 14.372 0 0021.84 12C19.896 7.8 15.816 4.656 12 4.656c-.936 0-1.872.192-2.808.528zM9.72 12c0-.432.12-.816.312-1.152l3.12 3.12A2.364 2.364 0 0112 14.28 2.295 2.295 0 019.72 12z"  /></Svg>;
}

export default EyeNoneLight;