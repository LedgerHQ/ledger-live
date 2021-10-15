import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RewardsUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.28 17.844h13.44v-.768h-2.28c2.136-1.416 3.48-3.792 3.48-6.456 0-4.368-3.552-7.92-7.92-7.92s-7.92 3.552-7.92 7.92c0 2.664 1.32 5.016 3.456 6.456H5.28v.768zM2.4 21.3h19.2v-6.36h-.84v5.544H3.24V14.94H2.4v6.36zm2.52-10.68A7.078 7.078 0 0112 3.54a7.078 7.078 0 017.08 7.08c0 2.952-1.824 5.472-4.368 6.456h-5.4c-2.568-.984-4.392-3.504-4.392-6.456z"  /></Svg>;
}

export default RewardsUltraLight;