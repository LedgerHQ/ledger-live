import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UstensilsMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.888 12v9.84h1.92v-9.816c1.92-.456 3.312-2.16 3.312-4.104V2.4h-1.8v5.52c0 1.152-.576 2.016-1.512 2.352V2.4h-1.92v7.872C5.976 9.912 5.4 9.048 5.4 7.92V2.4H3.6v5.52c0 1.944 1.392 3.648 3.288 4.08zm7.032 4.8h4.56v5.04h1.92V2.16c-3.6 0-6.48 2.88-6.48 6.48v8.16zm1.92-1.68V8.64c0-2.208 1.008-3.792 2.64-4.44v10.92h-2.64z"  /></Svg>;
}

export default UstensilsMedium;