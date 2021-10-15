import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ThreeCircledFinaLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.764 16.68c1.896 0 3.336-1.128 3.336-2.688 0-.984-.6-1.776-1.656-2.064v-.192c.936-.312 1.368-1.032 1.368-1.848 0-1.464-1.344-2.568-3.048-2.568-1.824 0-3.144 1.248-3.144 2.808v.168h1.176C8.796 9 9.372 8.4 10.764 8.4c1.272 0 1.872.504 1.872 1.584 0 .936-.312 1.368-1.872 1.368h-.816v1.08h.84c1.584 0 2.088.456 2.088 1.536 0 1.104-.672 1.632-2.136 1.632-1.512 0-2.064-.6-2.064-2.04h-1.2v.12c0 1.728 1.272 3 3.288 3zm-6.648 4.44h6.648c5.112 0 9.12-4.152 9.12-9.12 0-5.112-4.008-9.12-9.12-9.12H4.116v1.2h6.648c4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92H4.116v1.2z"  /></Svg>;
}

export default ThreeCircledFinaLight;