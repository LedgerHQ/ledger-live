import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.88c4.968 0 8.88-4.032 8.88-8.88 0-4.968-3.912-8.88-8.88-8.88-4.968 0-8.88 3.912-8.88 8.88 0 4.968 3.912 8.88 8.88 8.88zM3.6 12c0-4.704 3.696-8.4 8.4-8.4 4.704 0 8.4 3.696 8.4 8.4 0 4.584-3.696 8.4-8.4 8.4-4.704 0-8.4-3.696-8.4-8.4zm5.376-1.536h.48v-.216c0-1.32.864-2.424 2.52-2.424h.048c1.368 0 2.424.744 2.424 2.232 0 .96-.432 1.632-2.016 2.808l-3.264 2.4v1.2h5.88v-.48h-5.4v-.48l3.072-2.256c1.656-1.224 2.208-2.064 2.208-3.192 0-1.776-1.368-2.712-2.928-2.712-1.92 0-3.024 1.368-3.024 2.904v.216z"  /></Svg>;
}

export default TwoCircledThin;