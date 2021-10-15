import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShieldCheckRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.84c6.24-2.472 9.36-6.408 9.36-11.712v-5.04C18.696 3.168 15.456 2.16 12 2.16c-3.456 0-6.696 1.008-9.36 2.928v5.04c0 5.304 3.12 9.24 9.36 11.712zM4.2 10.128V5.832C6.504 4.344 9.072 3.624 12 3.624s5.496.72 7.8 2.208v4.296c0 4.656-2.4 7.824-7.8 10.104-5.4-2.28-7.8-5.448-7.8-10.104zm3.792 1.128l3.288 3.312 5.616-5.64-1.104-1.08-4.512 4.488-2.208-2.184-1.08 1.104z"  /></Svg>;
}

export default ShieldCheckRegular;