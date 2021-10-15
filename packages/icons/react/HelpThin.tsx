import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HelpThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.352 13.272h.84c1.92 0 3.288-1.392 3.288-3.408 0-1.944-1.296-3.384-3.384-3.384-2.064 0-3.36 1.416-3.36 3.216v.024h.48v-.024c0-1.608 1.032-2.736 2.856-2.736h.048c1.848 0 2.88 1.152 2.88 2.88v.048c0 1.8-1.104 2.904-2.808 2.904h-.84v.48zM3.12 12c0 4.968 3.912 8.88 8.88 8.88 4.968 0 8.88-4.032 8.88-8.88 0-4.968-3.912-8.88-8.88-8.88-4.968 0-8.88 3.912-8.88 8.88zm.48 0c0-4.704 3.696-8.4 8.4-8.4 4.704 0 8.4 3.696 8.4 8.4 0 4.584-3.696 8.4-8.4 8.4-4.704 0-8.4-3.696-8.4-8.4zm7.68 4.8h1.44v-1.44h-1.44v1.44z"  /></Svg>;
}

export default HelpThin;