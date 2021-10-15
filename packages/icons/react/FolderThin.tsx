import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FolderThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 19.92h17.76V5.928H12l-1.176-1.176c-.48-.48-.96-.672-1.656-.672H3.12v15.84zm.48-.48V9.288h16.8V19.44H3.6zm0-10.632V4.56h5.568c.6 0 .912.12 1.32.528l1.32 1.32H20.4v2.4H3.6z"  /></Svg>;
}

export default FolderThin;