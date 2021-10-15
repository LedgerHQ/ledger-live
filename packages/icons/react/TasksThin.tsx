import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TasksThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.408 19.104h1.44v-1.44h-1.44v1.44zm-1.056-7.368l1.8 1.824 2.808-2.808-.336-.336-2.472 2.472L2.688 11.4l-.336.336zm0-5.52l1.8 1.824L6.96 5.232l-.336-.336-2.472 2.472L2.688 5.88l-.336.336zm4.896 12.408h14.4v-.48h-14.4v.48zm1.44-5.52h12.96v-.48H8.688v.48zm0-5.52h12.96v-.48H8.688v.48z"  /></Svg>;
}

export default TasksThin;