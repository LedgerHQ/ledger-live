import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ProjectDiagramRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.944 20.88h6.624v-6.624h-5.376L9.264 9V7.104h5.472v2.64h6.624V3.12h-6.624v2.592H9.264V3.12H2.64v6.624h5.448l2.856 5.112v6.024zM4.032 8.352V4.488h3.864v3.864H4.032zm8.304 11.136v-3.864H16.2v3.864h-3.864zm3.792-11.136V4.488h3.864v3.864h-3.864z"  /></Svg>;
}

export default ProjectDiagramRegular;