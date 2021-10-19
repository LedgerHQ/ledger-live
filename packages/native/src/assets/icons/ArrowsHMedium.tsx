import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowsHMedium({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.478 17.447l-1.2 1.176L.63 11.999l6.648-6.624 1.2 1.176-3.384 3.36c-.384.384-.816.792-1.248 1.176h16.312a29.775 29.775 0 01-1.248-1.176l-3.384-3.36 1.2-1.176 6.648 6.624-6.648 6.624-1.2-1.176 3.384-3.36c.384-.384.816-.792 1.248-1.176H3.846c.432.384.864.792 1.248 1.176l3.384 3.36z"
        fill={color}
      />
    </Svg>
  );
}

export default ArrowsHMedium;
