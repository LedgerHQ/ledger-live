import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TasksUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.336 19.212h1.68v-1.68h-1.68v1.68zM2.304 11.82L4.2 13.74l2.904-2.904-.528-.528L4.2 12.684l-1.368-1.392-.528.528zm0-5.52L4.2 8.22l2.904-2.904-.528-.528L4.2 7.164 2.832 5.772l-.528.528zm5.112 12.48h14.28v-.84H7.416v.84zm1.32-5.52h12.96v-.84H8.736v.84zm0-5.52h12.96V6.9H8.736v.84z"  /></Svg>;
}

export default TasksUltraLight;