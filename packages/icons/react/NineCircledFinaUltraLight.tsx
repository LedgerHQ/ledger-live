import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NineCircledFinaUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.956 16.704c2.208 0 3.456-1.872 3.432-4.8-.024-2.856-1.272-4.56-3.408-4.56-1.752 0-3.072 1.32-3.072 3.12 0 1.752 1.272 3.072 3 3.072 1.224 0 2.208-.72 2.568-1.8h.072c.096 2.304-.456 4.2-2.616 4.2-1.272 0-2.016-.696-2.208-1.968h-.816c.168 1.656 1.392 2.736 3.048 2.736zM4.068 21h6.864c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9H4.068v.84h6.864c4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16H4.068V21zm4.68-10.464v-.216c0-1.344.816-2.184 2.208-2.184h.096c1.44 0 2.208.936 2.208 2.184v.216c0 1.344-.792 2.208-2.208 2.208h-.096c-1.392 0-2.208-.84-2.208-2.208z"  /></Svg>;
}

export default NineCircledFinaUltraLight;