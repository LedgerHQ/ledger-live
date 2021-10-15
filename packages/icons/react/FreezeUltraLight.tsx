import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FreezeUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.616 21.36h.768v-3.72l2.184 2.232.528-.528-2.712-2.712-.024-3.768L18 18.528l.528-.528-5.664-5.64 3.768.024 2.712 2.712.528-.528-2.232-2.184h3.72v-.768h-3.72l2.232-2.184-.528-.528-2.712 2.712-3.768.024L18.528 6 18 5.472l-5.64 5.664.024-3.768 2.712-2.712-.528-.528-2.184 2.232V2.64h-.768v3.72L9.432 4.128l-.528.528 2.712 2.712.024 3.768L6 5.472 5.472 6l5.664 5.64-3.768-.024-2.712-2.712-.528.528 2.232 2.184H2.64v.768h3.72l-2.232 2.184.528.528 2.712-2.712 3.768-.024L5.472 18l.528.528 5.64-5.664-.024 3.768-2.712 2.712.528.528 2.184-2.232v3.72z"  /></Svg>;
}

export default FreezeUltraLight;