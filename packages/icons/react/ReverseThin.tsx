import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ReverseThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.12c4.848 0 8.88-4.032 8.88-8.88 0-4.848-4.032-8.88-8.88-8.88-3.384 0-6.384 2.016-7.92 4.92v-5.4H3.6v6.144h6.144v-.48H4.488C5.952 5.76 8.808 3.84 12 3.84c4.608 0 8.4 3.816 8.4 8.4 0 4.584-3.816 8.4-8.4 8.4-4.584 0-8.4-3.816-8.4-8.4h-.48c0 4.848 4.032 8.88 8.88 8.88z"  /></Svg>;
}

export default ReverseThin;