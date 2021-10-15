import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UstensilsLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.332 11.76v10.08h1.2V11.76c1.896-.288 3.336-1.92 3.336-3.84V2.4h-1.152v5.52c0 1.392-.888 2.496-2.184 2.736V2.4h-1.2v8.256c-1.272-.24-2.184-1.344-2.184-2.736V2.4H3.996v5.52c0 1.92 1.464 3.552 3.336 3.84zm6.792 5.04h4.68v5.04h1.2V2.16a5.844 5.844 0 00-5.88 5.88v8.76zm1.2-1.08V8.04c0-2.4 1.416-4.176 3.48-4.608V15.72h-3.48z"  /></Svg>;
}

export default UstensilsLight;