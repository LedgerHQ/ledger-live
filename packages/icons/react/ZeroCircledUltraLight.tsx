import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-8.16-9c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16zm4.704.024c0 2.832 1.176 4.68 3.456 4.68 2.28 0 3.456-1.848 3.456-4.68S14.304 7.344 12 7.344c-2.28 0-3.456 1.848-3.456 4.68zm.84.312v-.6c0-2.448.84-3.624 2.616-3.624.96 0 1.656.336 2.064 1.032l-4.44 5.04c-.168-.504-.24-1.128-.24-1.848zm.528 2.52l4.464-5.064c.168.528.24 1.176.24 1.944v.6c0 2.424-.84 3.624-2.616 3.624-.984 0-1.68-.36-2.088-1.104z"  /></Svg>;
}

export default ZeroCircledUltraLight;