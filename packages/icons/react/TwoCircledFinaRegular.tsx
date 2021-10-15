import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledFinaRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.536 16.464h6.24v-1.368l-4.416.024v-.36l2.448-1.584c1.464-.96 2.04-1.872 2.04-3 0-1.8-1.44-2.832-3.216-2.832-1.968 0-3.288 1.32-3.288 2.832v.288H8.88V10.2c0-.96.432-1.488 1.68-1.488h.12c1.104 0 1.608.432 1.608 1.512 0 .744-.24 1.272-1.848 2.328l-2.904 1.92v1.992zM4.152 21.24h6.456c5.184 0 9.24-4.224 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24H4.152v1.56h6.456c4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68H4.152v1.56z"  /></Svg>;
}

export default TwoCircledFinaRegular;