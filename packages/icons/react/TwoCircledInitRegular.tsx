import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledInitRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.32 16.464h6.24v-1.368l-4.416.024v-.36l2.424-1.584c1.488-.96 2.064-1.872 2.064-3 0-1.8-1.44-2.832-3.216-2.832-1.968 0-3.288 1.32-3.288 2.832v.288h1.536V10.2c0-.96.432-1.488 1.68-1.488h.12c1.104 0 1.608.432 1.608 1.512 0 .744-.24 1.296-1.848 2.328l-2.904 1.92v1.992zM4.152 12c0 5.16 4.08 9.24 9.24 9.24h6.456v-1.56h-6.456c-4.296 0-7.68-3.384-7.68-7.68 0-4.2 3.384-7.68 7.68-7.68h6.456V2.76h-6.456c-5.184 0-9.24 4.2-9.24 9.24z"  /></Svg>;
}

export default TwoCircledInitRegular;