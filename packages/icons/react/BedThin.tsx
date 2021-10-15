import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BedThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.4 18.96h.48v-4.2h18.24v4.2h.48v-7.8c0-1.464-1.104-2.568-2.568-2.568h-7.776v5.688H2.88V5.04H2.4v13.92zm1.776-8.856a2.873 2.873 0 002.88 2.88c1.608 0 2.904-1.272 2.904-2.88 0-1.608-1.296-2.88-2.904-2.88a2.873 2.873 0 00-2.88 2.88zm.48 0c0-1.344 1.08-2.4 2.4-2.4 1.344 0 2.424 1.056 2.424 2.4 0 1.344-1.08 2.4-2.424 2.4-1.32 0-2.4-1.056-2.4-2.4zm7.08 4.176V9.072h7.296c1.248 0 2.088.84 2.088 2.088v3.12h-9.384z"  /></Svg>;
}

export default BedThin;