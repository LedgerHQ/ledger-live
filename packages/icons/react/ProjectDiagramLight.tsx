import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ProjectDiagramLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.944 20.88h6.624v-6.624h-5.664l-2.64-5.112V6.936h5.472v2.808h6.624V3.12h-6.624v2.736H9.264V3.12H2.64v6.624h5.712l2.592 4.992v6.144zM3.72 8.664V4.2h4.464v4.464H3.72zM12.024 19.8v-4.464h4.464V19.8h-4.464zm3.792-11.136V4.2h4.464v4.464h-4.464z"  /></Svg>;
}

export default ProjectDiagramLight;