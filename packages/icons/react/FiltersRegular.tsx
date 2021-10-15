import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiltersRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.048 21.36v-4.248H8.28v-1.56H2.16v1.56h2.232v4.248h1.656zm-1.656-7.728h1.656V2.64H4.392v10.992zM8.952 8.4h6.12V6.84h-2.256v-4.2h-1.632v4.2H8.952V8.4zm2.232 12.96h1.632V10.32h-1.632v11.04zm4.536-4.248h2.232v4.248h1.656v-4.248h2.232v-1.56h-6.12v1.56zm2.232-3.48h1.656V2.64h-1.656v10.992z"  /></Svg>;
}

export default FiltersRegular;