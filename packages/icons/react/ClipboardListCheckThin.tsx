import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ClipboardListCheckThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.32 20.88h15.36V4.56h-3.84V3.12H8.16v1.44H4.32v16.32zm.48-.48V5.04h3.36V6h7.68v-.96h3.36V20.4H4.8zM6.864 9.6l1.8 1.824 2.808-2.808-.336-.336-2.472 2.472L7.2 9.264l-.336.336zm1.056 7.368h1.44v-1.44H7.92v1.44zm3.84-.48h5.16v-.48h-5.16v.48zm1.44-5.52h3.72v-.48H13.2v.48z"  /></Svg>;
}

export default ClipboardListCheckThin;