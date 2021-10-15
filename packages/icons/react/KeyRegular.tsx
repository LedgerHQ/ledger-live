import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function KeyRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.92 21.36l1.152-1.152-2.304-2.304 1.296-1.296 2.304 2.28 1.152-1.152-2.28-2.304 4.104-4.128c.768.504 1.68.792 2.664.792 2.712 0 4.824-2.136 4.824-4.728 0-2.592-2.112-4.728-4.824-4.728-2.712 0-4.824 2.136-4.824 4.728 0 1.056.36 2.04.96 2.808l-8.976 9 1.152 1.152 1.272-1.248 2.328 2.28zm4.92-13.992A3.15 3.15 0 0116.008 4.2a3.135 3.135 0 013.168 3.168 3.15 3.15 0 01-3.168 3.168 3.165 3.165 0 01-3.168-3.168z"  /></Svg>;
}

export default KeyRegular;