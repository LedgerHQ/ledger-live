import * as React from "react";
import Svg, { SvgProps, Path, Rect } from "react-native-svg";

type Props = SvgProps & { size?: number; color?: string };

function Figment({ size = 32, ...props }: Props): JSX.Element {
  return (
    <Svg width={size} height={32} fill="none" {...props}>
      <Rect width={size} height={size} fill="#FFF29B" rx={10} />
      <Rect width={size} height={size} x={0.5} y={0.5} stroke="#fff" strokeOpacity={0.1} rx={9.5} />
      <Path fill="#111" d="M12.484 9.8v4.68h10.048v2.918H12.484v7.768H8.917V6.833h14.166V9.8z" />
    </Svg>
  );
}
export default Figment;
