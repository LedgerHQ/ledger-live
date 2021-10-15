import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HelpUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.28 13.344h.864c2.112 0 3.432-1.488 3.432-3.456 0-1.92-1.296-3.48-3.456-3.48-2.088 0-3.456 1.488-3.456 3.288v.072h.84v-.144c0-1.464.888-2.4 2.544-2.4h.12c1.68 0 2.568.936 2.568 2.52v.336c0 1.584-.912 2.472-2.472 2.472h-.984v.792zM3 12c0 5.04 3.96 9 9 9s9-4.104 9-9c0-5.04-3.96-9-9-9s-9 3.96-9 9zm.84 0c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16zm7.344 4.92h1.656v-1.656h-1.656v1.656z"  /></Svg>;
}

export default HelpUltraLight;