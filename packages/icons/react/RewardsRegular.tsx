import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RewardsRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.208 18.18h13.584v-1.368h-1.824c1.992-1.44 3.192-3.744 3.192-6.312 0-4.488-3.672-8.16-8.16-8.16-4.488 0-8.16 3.672-8.16 8.16 0 2.568 1.2 4.848 3.192 6.312H5.208v1.368zM1.92 21.66h20.16v-6.84h-1.56v5.376H3.48V14.82H1.92v6.84zM5.4 10.5c0-3.648 2.952-6.6 6.6-6.6 3.648 0 6.6 2.952 6.6 6.6 0 3.072-2.16 5.664-5.016 6.312H10.44A6.484 6.484 0 015.4 10.5z"  /></Svg>;
}

export default RewardsRegular;