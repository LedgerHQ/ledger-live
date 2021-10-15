import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ClipboardListCheckUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.14 21.12h15.72V4.416h-4.032V2.88h-7.68v1.536H4.14V21.12zm.84-.816V5.232h3.168v.696h7.68v-.696h3.192v15.072H4.98zM6.804 9.6L8.7 11.52l2.928-2.904-.552-.528-2.352 2.376-1.368-1.392-.552.528zm1.056 7.392h1.68v-1.68H7.86v1.68zm3.96-.432h5.04v-.84h-5.04v.84zm1.32-5.496h3.72v-.84h-3.72v.84z"  /></Svg>;
}

export default ClipboardListCheckUltraLight;