import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function VoteThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.32 21.36h15.36V2.64H9.672L4.32 7.992V21.36zm.48-.48V8.664h5.544V3.12H19.2v17.76H4.8zm0-12.696L9.864 3.12v5.064H4.8zm3.264 3.768l3.12 3.12 5.448-5.448-.336-.336-5.112 5.112L8.4 11.616l-.336.336z"  /></Svg>;
}

export default VoteThin;