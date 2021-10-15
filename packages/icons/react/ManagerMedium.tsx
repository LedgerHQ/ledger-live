import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ManagerMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.56 19.536v-4.68h4.56v4.68H4.56zM2.64 21.36h8.4v-8.304h-8.4v8.304zm0-10.44h8.4V2.64h-8.4v8.28zm1.92-1.8V4.44h4.56v4.68H4.56zm8.4 12.24h8.4v-8.304h-8.4v8.304zm0-10.44h8.4V2.64h-8.4v8.28zm1.92 8.616v-4.68h4.56v4.68h-4.56zm0-10.416V4.44h4.56v4.68h-4.56z"  /></Svg>;
}

export default ManagerMedium;