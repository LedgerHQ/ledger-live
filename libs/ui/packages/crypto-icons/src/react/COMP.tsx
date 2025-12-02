import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00d395";
function COMP({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M6.615 16.19A1.25 1.25 0 016 15.118v-2.44a.53.53 0 01.537-.523.55.55 0 01.27.071l5.627 3.211c.33.188.533.533.533.905v2.528a.63.63 0 01-.642.63.66.66 0 01-.337-.092zm8.388-4.632c.33.188.531.533.533.905v5.13a.42.42 0 01-.219.366l-1.231.678a.2.2 0 01-.05.02v-2.849c0-.369-.198-.71-.522-.9l-4.941-2.893V8.8a.53.53 0 01.537-.524q.144.001.27.071l5.624 3.211zm2.464-3.789c.33.188.533.533.533.907v7.492a.42.42 0 01-.226.37l-1.168.617v-5.217c0-.369-.198-.71-.52-.9l-5.051-2.964v-3.05a.53.53 0 01.072-.263.543.543 0 01.732-.19z" clipRule="evenodd" /></Svg>;
}
COMP.DefaultColor = DefaultColor;
export default COMP;