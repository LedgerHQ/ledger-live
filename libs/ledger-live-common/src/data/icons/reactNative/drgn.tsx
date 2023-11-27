
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function drgn({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path opacity={0.6} d="M7.04999 15.585H9.16349L9.10949 10.0897L16.98 20.082L16.9552 8.283H14.8747L14.9287 13.8337L7.05299 3.81525L7.04999 15.585Z" fill={color} /><Path d="M7.04999 7.46381L7.06199 3.82556L16.9492 16.3896L16.9905 20.0961L7.04999 7.46381Z" fill={color} /></Svg>;
}
export default drgn;