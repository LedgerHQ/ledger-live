import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledLeftRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.064 16.344l.96-.984-1.2-1.224c-.48-.456-.96-.936-1.464-1.392h7.68v-1.488H9.336c.504-.48 1.008-.936 1.488-1.416l1.2-1.248-.96-.96L6.72 12l4.344 4.344zM2.76 12c0 5.16 4.08 9.24 9.24 9.24 5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12zm1.56 0c0-4.32 3.384-7.68 7.68-7.68 4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68-4.296 0-7.68-3.384-7.68-7.68z"  /></Svg>;
}

export default CircledLeftRegular;