import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RefreshUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 11.856v.432h.84v-.432c0-4.464 3.624-8.016 8.136-8.016 3 0 5.64 1.68 7.08 4.176-.768 0-1.608-.024-2.424-.024h-2.376v.792H20.4V2.64h-.768v4.824C18 4.728 15.12 3 11.976 3 6.984 3 3 6.912 3 11.856zm.6 9.504h.792v-2.376c0-.768-.024-1.608-.024-2.448C6 19.272 8.88 21 12.024 21 17.016 21 21 17.064 21 12.144v-.432h-.84v.432c0 4.464-3.6 8.016-8.136 8.016-3 0-5.64-1.704-7.08-4.176h4.8v-.768H3.6v6.144z"  /></Svg>;
}

export default RefreshUltraLight;