import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EntitiesRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.68 21.36h6v-6H5.376v-2.664h5.928v2.664H9v6h6v-6h-2.304v-2.664h5.928v2.664H16.32v6h6v-6h-2.304v-4.056h-7.32V8.64H15v-6H9v6h2.304v2.664h-7.32v4.056H1.68v6zm1.392-1.32v-3.36h3.24v3.36h-3.24zm7.32 0v-3.36h3.24v3.36h-3.24zm0-12.72V3.96h3.24v3.36h-3.24zm7.32 12.72v-3.36h3.24v3.36h-3.24z"  /></Svg>;
}

export default EntitiesRegular;