import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ImportRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.76 20.34h18.48v-7.08h-1.56v5.52H4.32v-5.52H2.76v7.08zm4.872-8.064L12 16.62l4.344-4.344-.984-.96-1.248 1.248c-.456.456-.912.936-1.368 1.416V3.66h-1.488v10.344c-.456-.48-.912-.984-1.368-1.44l-1.272-1.248-.984.96z"  /></Svg>;
}

export default ImportRegular;