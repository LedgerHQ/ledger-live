import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HouseLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.32 21.36h6.432v-7.032h2.52v7.032h6.408V11.184l1.824 1.656.816-.84L12 2.64 1.68 12l.816.84 1.824-1.656V21.36zm1.176-1.152v-10.08L12 4.224l6.528 5.904v10.08h-4.176v-6.96h-4.68v6.96H5.496z"  /></Svg>;
}

export default HouseLight;