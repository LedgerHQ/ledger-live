import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ThreeCircledInitLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.236 16.68c1.896 0 3.336-1.128 3.336-2.688 0-.984-.6-1.776-1.656-2.064v-.192c.936-.312 1.368-1.032 1.368-1.848 0-1.464-1.344-2.568-3.048-2.568-1.824 0-3.144 1.248-3.144 2.808v.168h1.176c0-1.296.576-1.896 1.968-1.896 1.272 0 1.872.504 1.872 1.584 0 .936-.312 1.368-1.872 1.368h-.816v1.08h.84c1.584 0 2.088.456 2.088 1.536 0 1.104-.672 1.632-2.136 1.632-1.512 0-2.064-.6-2.064-2.04h-1.2v.12c0 1.728 1.272 3 3.288 3zM4.116 12c0 5.088 4.032 9.12 9.12 9.12h6.648v-1.2h-6.648c-4.44 0-7.92-3.48-7.92-7.92 0-4.32 3.48-7.92 7.92-7.92h6.648v-1.2h-6.648c-5.112 0-9.12 4.152-9.12 9.12z"  /></Svg>;
}

export default ThreeCircledInitLight;