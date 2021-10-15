import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledInitUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.068 16.704c1.92 0 3.144-1.32 3.144-3.096 0-1.8-1.248-3.072-2.976-3.072-.888 0-1.608.36-2.064.96h-.096l.336-3.144h4.296v-.768h-4.992l-.48 5.16h.792c.288-.888.936-1.464 2.064-1.464h.048c1.416 0 2.232.84 2.232 2.232v.192c0 1.392-.768 2.232-2.28 2.232h-.048c-1.512 0-2.28-.864-2.304-2.184h-.816c0 1.656 1.224 2.952 3.144 2.952zm-9-4.704c0 5.04 3.96 9 9 9h6.864v-.84h-6.864c-4.56 0-8.16-3.6-8.16-8.16 0-4.464 3.6-8.16 8.16-8.16h6.864V3h-6.864c-5.04 0-9 4.08-9 9z"  /></Svg>;
}

export default FiveCircledInitUltraLight;