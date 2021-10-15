import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MedalLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.96 13.752V21.6L12 18.792l5.04 2.808v-7.848c1.08-1.224 1.752-2.808 1.752-4.56A6.801 6.801 0 0012 2.4a6.801 6.801 0 00-6.792 6.792c0 1.752.672 3.336 1.752 4.56zm-.552-4.56A5.598 5.598 0 0112 3.6a5.582 5.582 0 015.592 5.592A5.598 5.598 0 0112 14.784c-3.072 0-5.592-2.52-5.592-5.592zm1.704 10.512v-5.016A6.576 6.576 0 0012 15.984c1.464 0 2.808-.504 3.912-1.296v5.016L12 17.544l-3.888 2.16z"  /></Svg>;
}

export default MedalLight;