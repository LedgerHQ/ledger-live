import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BracketsUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.8 10.2h.84V3.36H13.8v.84h6v6zM3.36 20.64h6.84v-.84h-6v-6.024h-.84v6.864zm0-10.44h.84v-6h6v-.84H3.36v6.84zM13.8 20.64h6.84V13.8h-.84v6h-6v.84z"  /></Svg>;
}

export default BracketsUltraLight;