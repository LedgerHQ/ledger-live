import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronRightRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.972 19.848l1.104 1.104L17.028 12 8.076 3.048 6.972 4.152 14.82 12l-7.848 7.848z"  /></Svg>;
}

export default ChevronRightRegular;