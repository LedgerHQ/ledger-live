import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CoffeeThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.82 16.2h2.952c1.608 0 3-.6 3.984-1.896a3.81 3.81 0 00.528-.84h.48c2.712 0 4.752-1.8 4.752-4.296 0-2.568-2.04-4.368-4.752-4.368H3.756v5.52c0 1.824.336 3.024 1.104 3.984C5.868 15.6 7.212 16.2 8.82 16.2zm-6.336 2.52c.336.288.792.48 1.272.48h14.16c.504 0 .936-.192 1.272-.48H2.484zm1.752-8.4V5.28h12.12v5.04c0 3.168-1.464 5.4-4.584 5.4H8.82c-3 0-4.584-2.136-4.584-5.4zm12.24 2.664c.264-.72.36-1.584.36-2.664V5.28c2.472.024 4.2 1.536 4.2 3.864v.048c0 2.28-1.752 3.792-4.272 3.792h-.288z"  /></Svg>;
}

export default CoffeeThin;