import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function YoutubeLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 19.248c4.32 0 7.008-.12 8.064-.384.984-.312 1.584-.912 1.824-1.824.384-1.416.432-3.864.432-5.04 0-1.128-.072-3.648-.432-5.04-.24-.912-.84-1.512-1.824-1.824-1.056-.264-3.744-.384-8.064-.384s-7.008.12-8.064.384c-.984.312-1.584.912-1.824 1.824-.36 1.392-.432 3.912-.432 5.04 0 1.176.048 3.624.432 5.04.24.912.84 1.512 1.824 1.824 1.056.264 3.744.384 8.064.384zm-2.112-4.152V8.928L15.312 12l-5.424 3.096z"  /></Svg>;
}

export default YoutubeLight;