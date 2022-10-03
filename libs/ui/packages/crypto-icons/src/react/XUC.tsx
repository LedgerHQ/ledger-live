import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";

function XUC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0zm-2.828.26c.006-.094 0 0 0-.096 0-2.705-1.998-5.108-4.591-5.512V5.077l-1.68.523v1.053a5.412 5.412 0 00-4.577 5.343 5.416 5.416 0 004.758 5.374v1.551l1.68-.523v-1.085a5.422 5.422 0 004.081-3.51h-1.74a3.81 3.81 0 01-5.96.99 3.82 3.82 0 01-1.208-2.52l9.238-.014zm-8.985-1.662a3.82 3.82 0 017.108 0H8.438z"  /><path d="M20.25 12a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0zm-2.828.26c.006-.094 0 0 0-.096 0-2.705-1.998-5.108-4.591-5.512V5.077l-1.68.523v1.053a5.412 5.412 0 00-4.577 5.343 5.416 5.416 0 004.758 5.374v1.551l1.68-.523v-1.085a5.422 5.422 0 004.081-3.51h-1.74a3.81 3.81 0 01-5.96.99 3.82 3.82 0 01-1.208-2.52l9.238-.014zm-8.985-1.662a3.82 3.82 0 017.108 0H8.438z"  /></Svg>;
}

XUC.DefaultColor = DefaultColor;
export default XUC;