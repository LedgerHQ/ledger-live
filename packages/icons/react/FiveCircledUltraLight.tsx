import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-8.16-9c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16zm5.016 1.752c0 1.656 1.224 2.952 3.144 2.952 1.92 0 3.144-1.32 3.144-3.096 0-1.8-1.248-3.072-2.976-3.072-.888 0-1.608.36-2.064.96h-.096l.336-3.144h4.296v-.768H9.648l-.48 5.16h.792c.288-.888.936-1.464 2.064-1.464h.048c1.416 0 2.232.84 2.232 2.232v.192c0 1.392-.768 2.232-2.28 2.232h-.048c-1.512 0-2.28-.864-2.304-2.184h-.816z"  /></Svg>;
}

export default FiveCircledUltraLight;