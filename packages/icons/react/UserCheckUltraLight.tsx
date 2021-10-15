import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserCheckUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.264 19.188v1.992h14.664v-2.976l-.888.864v1.296H4.128V18.9c0-2.448 1.776-4.176 4.272-4.176h1.608l-.864-.864h-.648a5.196 5.196 0 00-4.152 2.04c-.696.888-1.08 1.992-1.08 3.288zm2.928-12c0 2.424 1.968 4.368 4.392 4.368 2.424 0 4.392-1.944 4.392-4.368 0-2.424-1.968-4.368-4.392-4.368-2.424 0-4.392 1.944-4.392 4.368zm.84 0a3.544 3.544 0 013.552-3.552 3.544 3.544 0 013.552 3.552 3.544 3.544 0 01-3.552 3.552 3.544 3.544 0 01-3.552-3.552zm5.04 6.84l3.168 3.192 5.496-5.52-.576-.576-4.92 4.896-2.592-2.568-.576.576z"  /></Svg>;
}

export default UserCheckUltraLight;