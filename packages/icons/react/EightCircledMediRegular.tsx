import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EightCircledMediRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.976 16.704h.048c1.968 0 3.432-1.152 3.432-2.688 0-.96-.576-1.752-1.512-2.064v-.216c.744-.288 1.224-1.008 1.224-1.848 0-1.44-1.392-2.544-3.168-2.544h-.024c-1.752 0-3.144 1.104-3.144 2.544 0 .84.504 1.584 1.248 1.872v.192c-.936.312-1.512 1.08-1.512 2.064 0 1.536 1.464 2.688 3.408 2.688zM5.76 21.24h12.48v-1.56H5.76v1.56zm0-16.92h12.48V2.76H5.76v1.56zm4.44 9.864v-.432c0-.768.552-1.152 1.728-1.152h.192c1.2 0 1.728.384 1.728 1.152v.432c0 .768-.552 1.128-1.728 1.128h-.192c-1.176 0-1.728-.36-1.728-1.128zm.144-3.936v-.456c0-.696.48-1.056 1.56-1.056h.168c1.08 0 1.584.36 1.584 1.056v.456c0 .696-.504 1.032-1.584 1.032h-.168c-1.08 0-1.56-.336-1.56-1.032z"  /></Svg>;
}

export default EightCircledMediRegular;