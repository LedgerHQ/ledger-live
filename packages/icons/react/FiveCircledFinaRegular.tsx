import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledFinaRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.608 16.704c1.944 0 3.264-1.296 3.264-3.072 0-1.752-1.248-3.072-2.928-3.072-.72 0-1.32.264-1.704.672h-.216l.288-2.304h4.056V7.584h-5.28l-.456 5.16h1.392c.24-.576.648-.864 1.536-.864h.096c1.152 0 1.656.456 1.656 1.464v.528c0 1.008-.48 1.464-1.656 1.464h-.096c-1.224 0-1.704-.48-1.728-1.584H7.296c0 1.68 1.368 2.952 3.312 2.952zM4.152 21.24h6.456c5.184 0 9.24-4.224 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24H4.152v1.56h6.456c4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68H4.152v1.56z"  /></Svg>;
}

export default FiveCircledFinaRegular;