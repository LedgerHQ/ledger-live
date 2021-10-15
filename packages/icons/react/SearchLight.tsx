import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SearchLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M15.3 16.188l5.736 5.76.912-.912-5.76-5.736a7.845 7.845 0 001.944-5.208c0-4.416-3.624-8.04-8.04-8.04-4.416 0-8.04 3.624-8.04 8.04 0 4.416 3.624 8.04 8.04 8.04 1.992 0 3.816-.72 5.208-1.944zM3.252 10.092c0-3.768 3.072-6.84 6.84-6.84s6.84 3.072 6.84 6.84-3.072 6.84-6.84 6.84-6.84-3.072-6.84-6.84z"  /></Svg>;
}

export default SearchLight;