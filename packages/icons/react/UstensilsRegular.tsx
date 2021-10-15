import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UstensilsRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.104 11.88v9.96h1.56v-9.96c1.896-.36 3.312-2.04 3.312-3.96V2.4h-1.464v5.52c0 1.272-.744 2.256-1.848 2.544V2.4h-1.56v8.064C6 10.176 5.256 9.192 5.256 7.92V2.4H3.792v5.52c0 1.92 1.416 3.6 3.312 3.96zm6.912 4.92h4.632v5.04h1.56V2.16c-3.432 0-6.192 2.736-6.192 6.168V16.8zm1.56-1.392v-7.08c0-2.28 1.2-3.96 3.072-4.512v11.592h-3.072z"  /></Svg>;
}

export default UstensilsRegular;