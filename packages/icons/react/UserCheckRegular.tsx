import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserCheckRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.144 19.428V21.3h14.904v-3.384l-1.656 1.632v.288H4.776V18.54c0-2.136 1.104-3.144 3.312-3.144h2.472L8.904 13.74h-.48c-1.8 0-3.192.744-4.2 2.016-.72.936-1.08 2.088-1.08 3.672zM5.88 7.308c0 2.568 2.136 4.608 4.704 4.608 2.568 0 4.704-2.04 4.704-4.608 0-2.568-2.136-4.608-4.704-4.608-2.568 0-4.704 2.04-4.704 4.608zm1.56 0a3.124 3.124 0 013.144-3.144 3.124 3.124 0 013.144 3.144 3.124 3.124 0 01-3.144 3.144A3.124 3.124 0 017.44 7.308zm4.512 6.96l3.288 3.312 5.616-5.64-1.104-1.08-4.512 4.488-2.208-2.184-1.08 1.104z"  /></Svg>;
}

export default UserCheckRegular;