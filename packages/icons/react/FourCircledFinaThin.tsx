import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledFinaThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.168 11.664v2.184h-4.2l3.84-5.784h.36v3.6zM4.032 20.88h7.056c4.968 0 8.88-4.032 8.88-8.88 0-4.968-3.912-8.88-8.88-8.88H4.032v.48h7.056c4.704 0 8.4 3.696 8.4 8.4 0 4.584-3.696 8.4-8.4 8.4H4.032v.48zm3.432-6.552h4.704v2.136h.48v-2.136h1.512v-.48h-1.512V7.584h-1.08l-4.104 6.168v.576z"  /></Svg>;
}

export default FourCircledFinaThin;