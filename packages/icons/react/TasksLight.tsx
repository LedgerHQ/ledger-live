import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TasksLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.264 19.32h1.92V17.4h-1.92v1.92zm-1.008-7.416l1.992 2.016 3-3-.72-.72-2.28 2.28-1.272-1.296-.72.72zm0-5.52L4.248 8.4l3-3-.72-.72-2.28 2.28-1.272-1.296-.72.72zM7.584 18.96h14.16v-1.2H7.584v1.2zm1.2-5.52h12.96v-1.2H8.784v1.2zm0-5.52h12.96v-1.2H8.784v1.2z"  /></Svg>;
}

export default TasksLight;