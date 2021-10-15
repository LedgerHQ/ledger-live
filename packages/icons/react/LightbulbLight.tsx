import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LightbulbLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.868 17.832V21.6h6.24v-3.768c0-1.104.288-1.608 1.392-2.88l.576-.648c1.32-1.512 2.016-3.072 2.016-4.896 0-4.176-3.36-7.008-7.104-7.008s-7.08 2.832-7.08 7.008c0 1.824.672 3.384 1.992 4.896l.576.648c1.104 1.272 1.392 1.776 1.392 2.88zm-2.76-8.424c0-3.504 2.76-5.88 5.88-5.88 3.144 0 5.904 2.376 5.904 5.88 0 1.536-.576 2.856-1.704 4.128l-.576.672c-1.152 1.296-1.656 2.16-1.704 3.576h-1.344v-5.28h-1.152v5.28h-1.344c-.048-1.416-.552-2.28-1.68-3.576l-.576-.672c-1.128-1.272-1.704-2.592-1.704-4.128zm3.96 11.04v-1.584h3.84v1.584h-3.84z"  /></Svg>;
}

export default LightbulbLight;