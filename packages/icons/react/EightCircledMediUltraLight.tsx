import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EightCircledMediUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.976 16.704h.048c1.896 0 3.216-1.128 3.216-2.616 0-1.008-.624-1.848-1.656-2.208v-.096c.888-.336 1.416-1.08 1.416-1.968 0-1.392-1.248-2.472-2.976-2.472h-.048C10.248 7.344 9 8.424 9 9.816c0 .888.552 1.632 1.416 1.968v.096c-1.032.36-1.632 1.176-1.632 2.208 0 1.488 1.32 2.616 3.192 2.616zM5.76 21h12.48v-.84H5.76V21zm0-17.16h12.48V3H5.76v.84zm3.888 10.32v-.192c0-1.056.792-1.728 2.304-1.728h.096c1.536 0 2.328.672 2.328 1.728v.192c0 1.08-.816 1.752-2.328 1.752h-.096c-1.488 0-2.304-.672-2.304-1.752zm.192-4.224v-.168c0-1.008.744-1.632 2.112-1.632h.096c1.368 0 2.112.624 2.112 1.632v.168c0 .984-.72 1.584-2.112 1.584h-.096c-1.392 0-2.112-.6-2.112-1.584z"  /></Svg>;
}

export default EightCircledMediUltraLight;