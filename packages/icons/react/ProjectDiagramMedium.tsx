import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ProjectDiagramMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.944 20.88h6.624v-6.624h-5.112l-3.192-5.4V7.248h5.472v2.496h6.624V3.12h-6.624v2.448H9.264V3.12H2.64v6.624h5.208l3.096 5.232v5.904zM4.32 8.064V4.8h3.264v3.264H4.32zM12.624 19.2v-3.264h3.264V19.2h-3.264zm3.792-11.136V4.8h3.264v3.264h-3.264z"  /></Svg>;
}

export default ProjectDiagramMedium;