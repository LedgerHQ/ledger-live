import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowLeftRegular({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.276 18.624l.984-.96-3.336-3.312c-.528-.528-1.08-1.08-1.656-1.608h16.104v-1.488H5.268a53.09 53.09 0 001.656-1.608l3.336-3.312-.984-.96L2.628 12l6.648 6.624z"
        fill={color}
      />
    </Svg>
  );
}

export default ArrowLeftRegular;
