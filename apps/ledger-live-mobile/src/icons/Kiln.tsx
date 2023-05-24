import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

type Props = SvgProps & { size?: number; color?: string };

function Kiln({ size = 16 }: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Path fill="#FBFBFB" d="M0 0h56v56H0z" />
      <Path
        d="M27.274 20.385c.193-.198.46-.318.755-.318.296 0 .559.117.749.31l4.694 4.695c.38.38.996.38 1.376 0l3.734-3.735a.974.974 0 000-1.376l-7.822-7.833a3.855 3.855 0 00-5.45 0l-7.833 7.833a.974.974 0 000 1.376l3.734 3.735c.38.38.996.38 1.376 0l4.687-4.687z"
        fill="#FF6521"
      />
      <Path
        d="M43.703 25.075l-1.697-1.697a.974.974 0 00-1.376 0L28.777 35.23a1.06 1.06 0 01-1.496.004L15.432 23.378a.974.974 0 00-1.376 0l-1.697 1.697a3.855 3.855 0 000 5.45l12.947 12.947a3.855 3.855 0 005.45 0l12.947-12.947a3.855 3.855 0 000-5.45z"
        fill="#202020"
      />
    </Svg>
  );
}
export default Kiln;
