import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShieldCheckThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.84c6.24-2.472 9.36-6.408 9.36-11.712v-5.04C18.696 3.168 15.456 2.16 12 2.16c-3.456 0-6.696 1.008-9.36 2.928v5.04c0 5.304 3.12 9.24 9.36 11.712zM3.12 10.128v-4.8C5.688 3.552 8.712 2.64 12 2.64c3.288 0 6.312.912 8.88 2.688v4.8c0 5.088-2.88 8.76-8.88 11.184-6-2.424-8.88-6.096-8.88-11.184zm5.04.96l3.12 3.12 5.448-5.448-.336-.336-5.112 5.112-2.784-2.784-.336.336z"  /></Svg>;
}

export default ShieldCheckThin;