import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function VoteMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.08 21.36h15.84V2.64H9.432L4.08 7.992V21.36zM6 19.56V8.712h4.272V4.44H18v15.12H6zm1.824-7.392l3.36 3.384 5.664-5.688-1.344-1.344-4.32 4.296-2.016-1.992-1.344 1.344z"  /></Svg>;
}

export default VoteMedium;