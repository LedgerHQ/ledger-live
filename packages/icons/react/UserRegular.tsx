import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.548 19.428V21.3h14.904v-1.872c-.024-1.608-.36-2.76-1.08-3.672-.984-1.272-2.592-2.016-4.392-2.016H9.996c-1.8 0-3.36.744-4.368 2.016-.72.936-1.08 2.088-1.08 3.672zm1.632.408V18.54c0-2.136 1.104-3.144 3.312-3.144h5.016c2.184 0 3.288 1.008 3.288 3.144v1.296H6.18zM7.284 7.308c0 2.568 2.136 4.608 4.704 4.608 2.568 0 4.704-2.04 4.704-4.608 0-2.568-2.136-4.608-4.704-4.608-2.568 0-4.704 2.04-4.704 4.608zm1.56 0a3.124 3.124 0 013.144-3.144 3.124 3.124 0 013.144 3.144 3.124 3.124 0 01-3.144 3.144 3.124 3.124 0 01-3.144-3.144z"  /></Svg>;
}

export default UserRegular;