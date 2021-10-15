import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GraphGrowRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.832 14.832l4.944-4.968h7.704l4.392-4.368c-.024.72-.024 1.44-.024 2.136v1.656h1.344V3.12h-6.144v1.368h1.632c.696 0 1.416 0 2.112-.024L14.856 8.4H7.2l-4.368 4.344v2.088zm-.024 6.048h1.656v-2.928H2.808v2.928zm4.176 0H8.64v-4.824H6.984v4.824zm4.2 0h1.632v-7.92h-1.632v7.92zm4.176 0h1.656v-5.76H15.36v5.76zm4.152 0h1.656V12h-1.656v8.88z"  /></Svg>;
}

export default GraphGrowRegular;