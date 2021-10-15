import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LendLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.988 13.752v1.152c6.84-.912 12.552-4.656 16.968-9.984-.024.864-.024 1.704-.024 2.544v1.824h1.08l-.024-6.168h-6.144V4.2h1.776c.816 0 1.656 0 2.472-.024-4.224 5.136-9.6 8.664-16.104 9.576zm0 7.128h1.248v-2.928H2.988v2.928zm4.176 0h1.272v-4.272H7.164v4.272zm4.2 0h1.248v-5.688h-1.248v5.688zm4.176 0h1.272v-7.056H15.54v7.056zm4.176 0h1.272v-8.4h-1.272v8.4z"  /></Svg>;
}

export default LendLight;