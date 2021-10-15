import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledInitRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.464 13.128v3.336h1.56v-8.88h-1.992l-2.904 2.688v1.848l2.976-2.736h.408c0 .312-.048 1.824-.048 3.744zM4.152 12c0 5.16 4.08 9.24 9.24 9.24h6.456v-1.56h-6.456c-4.296 0-7.68-3.384-7.68-7.68 0-4.2 3.384-7.68 7.68-7.68h6.456V2.76h-6.456c-5.184 0-9.24 4.2-9.24 9.24z"  /></Svg>;
}

export default OneCircledInitRegular;