import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CoffeeLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.856 16.08h2.952c1.608 0 3-.6 3.984-1.896a3.31 3.31 0 00.408-.6h.72c2.784 0 4.872-1.848 4.872-4.416 0-2.64-2.088-4.488-4.872-4.488H3.792v5.52c0 1.824.336 3.024 1.104 3.984 1.008 1.296 2.352 1.896 3.96 1.896zm-6.648 2.04c.168.672.816 1.2 1.584 1.2h14.16c.792 0 1.44-.528 1.608-1.2H2.208zm2.856-7.272v-5.04h10.56v5.04c0 2.568-1.104 4.032-3.696 4.032H8.76c-2.544 0-3.696-1.416-3.696-4.032zm11.568 1.584c.168-.624.24-1.344.24-2.232V5.808c2.448.024 3.672.984 3.672 3.048v.576c0 1.992-1.2 3-3.552 3h-.36z"  /></Svg>;
}

export default CoffeeLight;