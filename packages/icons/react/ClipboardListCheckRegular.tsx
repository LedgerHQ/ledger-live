import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ClipboardListCheckRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.78 21.6h16.44V4.128h-4.392V2.4h-7.68v1.728H3.78V21.6zm1.56-1.488V5.592h2.808v.216h7.68v-.216h2.832v14.52H5.34zM6.732 9.624l2.088 2.112 3.12-3.096-.936-.912-2.16 2.184-1.176-1.2-.936.912zm1.008 7.392H9.9v-2.16H7.74v2.16zm4.2-.288h4.8v-1.56h-4.8v1.56zm1.08-5.496h3.72v-1.56h-3.72v1.56z"  /></Svg>;
}

export default ClipboardListCheckRegular;