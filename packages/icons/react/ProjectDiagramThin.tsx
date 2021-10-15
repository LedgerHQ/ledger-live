import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ProjectDiagramThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.944 20.88h6.624v-6.624h-6.216l-2.088-4.8V6.648h5.472v3.096h6.624V3.12h-6.624v3.048H9.264V3.12H2.64v6.624h6.216l2.088 4.752v6.384zM3.12 9.264V3.6h5.664v5.664H3.12zM11.424 20.4v-5.664h5.664V20.4h-5.664zm3.792-11.136V3.6h5.664v5.664h-5.664z"  /></Svg>;
}

export default ProjectDiagramThin;