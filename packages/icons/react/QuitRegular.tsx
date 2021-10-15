import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QuitRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.54 21.72h12.24V2.28H9.54v5.4h1.56V3.84h9.12v16.32H11.1v-3.84H9.54v5.4zM2.22 12l4.344 4.344.96-.984-1.248-1.272c-.456-.432-.936-.912-1.416-1.344h10.8v-1.488H4.836c.48-.456.984-.912 1.44-1.368l1.248-1.296-.96-.96L2.22 12z"  /></Svg>;
}

export default QuitRegular;