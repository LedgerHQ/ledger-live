import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BuyCryptoRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 12h1.488V6.84h15.6a81.67 81.67 0 00-1.464 1.368L17.016 9.48l.96.984 4.344-4.368-4.344-4.344-.96.984 1.248 1.248c.456.456.936.912 1.416 1.368H2.64V12zm-.96 5.904l4.344 4.344.96-.984-1.248-1.272c-.456-.432-.936-.912-1.416-1.344h17.04V12h-1.488v5.16H4.296c.48-.456.984-.912 1.44-1.368l1.248-1.296-.96-.96-4.344 4.368z"  /></Svg>;
}

export default BuyCryptoRegular;