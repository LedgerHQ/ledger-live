import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledInitRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.392 16.704c1.944 0 3.264-1.296 3.264-3.072 0-1.752-1.248-3.072-2.928-3.072-.72 0-1.32.264-1.704.672h-.216l.288-2.304h4.056V7.584h-5.28l-.456 5.16h1.392c.24-.576.648-.864 1.536-.864h.096c1.152 0 1.656.456 1.656 1.464v.528c0 1.008-.48 1.464-1.656 1.464h-.096c-1.224 0-1.704-.48-1.728-1.584H10.08c0 1.68 1.368 2.952 3.312 2.952zM4.152 12c0 5.16 4.08 9.24 9.24 9.24h6.456v-1.56h-6.456c-4.296 0-7.68-3.384-7.68-7.68 0-4.2 3.384-7.68 7.68-7.68h6.456V2.76h-6.456c-5.184 0-9.24 4.2-9.24 9.24z"  /></Svg>;
}

export default FiveCircledInitRegular;