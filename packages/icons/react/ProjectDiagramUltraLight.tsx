import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ProjectDiagramUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.944 20.88h6.624v-6.624H11.64L9.264 9.312v-2.52h5.472v2.952h6.624V3.12h-6.624v2.904H9.264V3.12H2.64v6.624h5.976l2.328 4.872v6.264zM3.432 8.952V3.888h5.064v5.064H3.432zm8.304 11.136v-5.064H16.8v5.064h-5.064zm3.792-11.136V3.888h5.064v5.064h-5.064z"  /></Svg>;
}

export default ProjectDiagramUltraLight;