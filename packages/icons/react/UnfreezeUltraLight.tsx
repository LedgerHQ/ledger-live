import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UnfreezeUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M21.072 21.648l.576-.576-18.72-18.72-.576.576 8.664 8.688-3.624-.024L4.68 8.88l-.528.528 2.256 2.184H2.664v.768l3.744-.024-2.256 2.208.528.528 2.712-2.712 3.768-.024-5.664 5.64.528.528 5.64-5.664-.024 3.768-2.712 2.712.528.528 2.208-2.256-.024 3.744h.768v-3.744l2.184 2.256.528-.528-2.712-2.712-.024-3.624 8.688 8.664zM8.928 4.632l3.48 3.48v-.768l2.712-2.712-.528-.528-2.184 2.256V2.616h-.768l.024 3.744-2.208-2.256-.528.528zM13.896 9.6l.504.504 4.152-4.128-.528-.528L13.896 9.6zm1.992 1.992l3.48 3.48.528-.528-2.256-2.208 3.744.024v-.768H17.64l2.256-2.184-.528-.528-2.712 2.712h-.768z"  /></Svg>;
}

export default UnfreezeUltraLight;