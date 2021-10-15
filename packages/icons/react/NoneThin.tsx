import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NoneThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.88c4.968 0 8.88-4.032 8.88-8.88 0-4.968-3.912-8.88-8.88-8.88-4.968 0-8.88 3.912-8.88 8.88 0 4.968 3.912 8.88 8.88 8.88zM3.6 12c0-4.704 3.696-8.4 8.4-8.4 2.256 0 4.296.864 5.784 2.28L5.88 17.784C4.464 16.296 3.6 14.256 3.6 12zm2.616 6.12L18.12 6.216C19.536 7.704 20.4 9.744 20.4 12c0 4.584-3.696 8.4-8.4 8.4-2.256 0-4.296-.864-5.784-2.28z"  /></Svg>;
}

export default NoneThin;