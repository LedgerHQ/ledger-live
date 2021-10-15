import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.24c5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12s4.08 9.24 9.24 9.24zM4.32 12c0-4.32 3.384-7.68 7.68-7.68 4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68-4.296 0-7.68-3.384-7.68-7.68zm4.368 1.752c0 1.68 1.368 2.952 3.312 2.952 1.944 0 3.264-1.296 3.264-3.072 0-1.752-1.248-3.072-2.928-3.072-.72 0-1.32.264-1.704.672h-.216l.288-2.304h4.056V7.584H9.48l-.456 5.16h1.392c.24-.576.648-.864 1.536-.864h.096c1.152 0 1.656.456 1.656 1.464v.528c0 1.008-.48 1.464-1.656 1.464h-.096c-1.224 0-1.704-.48-1.728-1.584H8.688z"  /></Svg>;
}

export default FiveCircledRegular;