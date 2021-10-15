import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShieldCheckLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.84c6.24-2.472 9.36-6.408 9.36-11.712v-5.04C18.696 3.168 15.456 2.16 12 2.16c-3.456 0-6.696 1.008-9.36 2.928v5.04c0 5.304 3.12 9.24 9.36 11.712zM3.84 10.128V5.664C6.24 4.08 8.952 3.288 12 3.288s5.76.792 8.16 2.376v4.464c0 4.8-2.544 8.136-8.16 10.464-5.616-2.328-8.16-5.664-8.16-10.464zm4.2 1.056l3.24 3.264 5.568-5.568-.84-.84-4.728 4.704-2.4-2.4-.84.84z"  /></Svg>;
}

export default ShieldCheckLight;