import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TasksRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.192 19.428h2.16v-2.16h-2.16v2.16zm-.984-7.44L4.296 14.1l3.096-3.096-.912-.912-2.184 2.184-1.176-1.2-.912.912zm0-5.52L4.296 8.58l3.096-3.096-.912-.912-2.184 2.184-1.176-1.2-.912.912zm5.544 12.648h14.04v-1.56H7.752v1.56zm1.08-5.52h12.96v-1.56H8.832v1.56zm0-5.52h12.96v-1.56H8.832v1.56z"  /></Svg>;
}

export default TasksRegular;