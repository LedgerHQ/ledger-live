import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UstensilsUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.536 11.64v10.2h.84v-10.2a3.76 3.76 0 003.336-3.72V2.4h-.792v5.52c0 1.512-1.08 2.736-2.544 2.928V2.4h-.84v8.448c-1.464-.192-2.544-1.416-2.544-2.928V2.4H4.2v5.52c0 1.896 1.464 3.504 3.336 3.72zm6.672 5.16h4.752v5.04h.84V2.16a5.562 5.562 0 00-5.592 5.568V16.8zm.84-.792v-8.28c0-2.472 1.632-4.344 3.912-4.68v12.96h-3.912z"  /></Svg>;
}

export default UstensilsUltraLight;