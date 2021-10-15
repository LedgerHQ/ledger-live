import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RewardsThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.304 17.688h13.392v-.48h-2.52c2.208-1.416 3.624-3.816 3.624-6.528 0-4.296-3.504-7.8-7.8-7.8-4.296 0-7.8 3.504-7.8 7.8 0 2.712 1.392 5.112 3.6 6.528H5.304v.48zM2.64 21.12h18.72V15h-.48v5.64H3.12V15h-.48v6.12zm2.04-10.44A7.303 7.303 0 0112 3.36a7.303 7.303 0 017.32 7.32 7.306 7.306 0 01-4.008 6.528H8.688A7.306 7.306 0 014.68 10.68z"  /></Svg>;
}

export default RewardsThin;