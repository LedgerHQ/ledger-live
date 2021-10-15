import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TasksMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 19.536h2.4v-2.4h-2.4v2.4zm-.96-7.464l2.184 2.208 3.192-3.192-1.104-1.104-2.088 2.088-1.08-1.104-1.104 1.104zm0-5.52L4.344 8.76l3.192-3.192-1.104-1.104-2.088 2.088-1.08-1.104L2.16 6.552zm5.76 12.744h13.92v-1.92H7.92v1.92zm.96-5.52h12.96v-1.92H8.88v1.92zm0-5.52h12.96v-1.92H8.88v1.92z"  /></Svg>;
}

export default TasksMedium;