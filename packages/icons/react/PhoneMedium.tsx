import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PhoneMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.096 21.84l3.744-3.888-5.904-5.304-4.272 4.2A21.889 21.889 0 019.24 14.76a24.765 24.765 0 01-2.088-2.424l4.2-4.272L6.048 2.16 2.16 5.928c.72 3.72 2.928 7.344 5.736 10.176 2.856 2.832 6.432 5.04 10.2 5.736zM4.272 6.552l1.68-1.608 2.76 3.072-2.64 2.688c-.792-1.32-1.416-2.712-1.8-4.152zm9 11.4l2.712-2.664 3.072 2.76-1.608 1.68c-1.44-.384-2.832-.984-4.176-1.776z"  /></Svg>;
}

export default PhoneMedium;