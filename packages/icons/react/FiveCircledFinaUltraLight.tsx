import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledFinaUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.932 16.704c1.92 0 3.144-1.32 3.144-3.096 0-1.8-1.248-3.072-2.976-3.072-.888 0-1.608.36-2.064.96H8.94l.336-3.144h4.296v-.768H8.58l-.48 5.16h.792c.288-.888.936-1.464 2.064-1.464h.048c1.416 0 2.232.84 2.232 2.232v.192c0 1.392-.768 2.232-2.28 2.232h-.048c-1.512 0-2.28-.864-2.304-2.184h-.816c0 1.656 1.224 2.952 3.144 2.952zM4.068 21h6.864c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9H4.068v.84h6.864c4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16H4.068V21z"  /></Svg>;
}

export default FiveCircledFinaUltraLight;