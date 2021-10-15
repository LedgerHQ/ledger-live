import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.668 19.188v1.992h14.664v-1.992c-.024-1.296-.408-2.4-1.08-3.288a5.42 5.42 0 00-4.248-2.04H9.972c-1.704 0-3.264.792-4.224 2.04-.696.888-1.08 1.992-1.08 3.288zm.864 1.176V18.9c0-2.472 1.776-4.176 4.272-4.176h4.392c2.472 0 4.248 1.704 4.248 4.176v1.464H5.532zM7.596 7.188c0 2.424 1.968 4.368 4.392 4.368 2.424 0 4.392-1.944 4.392-4.368 0-2.424-1.968-4.368-4.392-4.368-2.424 0-4.392 1.944-4.392 4.368zm.84 0a3.544 3.544 0 013.552-3.552 3.544 3.544 0 013.552 3.552 3.544 3.544 0 01-3.552 3.552 3.544 3.544 0 01-3.552-3.552z"  /></Svg>;
}

export default UserUltraLight;