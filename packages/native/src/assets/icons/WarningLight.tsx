import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function WarningLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.208 20.88h19.584L12 3.12 2.208 20.88zm1.968-1.152L12 5.568l7.824 14.16H4.176zm6.888-1.488h1.848v-1.848h-1.848v1.848zm.336-6.096l.096 2.736h1.008l.12-2.736v-2.28H11.4v2.28z"
        fill={color}
      />
    </Svg>
  );
}

export default WarningLight;
