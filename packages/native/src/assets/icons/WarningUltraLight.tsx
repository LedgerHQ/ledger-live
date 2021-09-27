import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function WarningUltraLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.472 20.64h19.056L12 3.36 2.472 20.64zm1.392-.792L12 5.064l8.136 14.784H3.864zm7.32-1.608h1.632v-1.632h-1.632v1.632zm.384-6.144l.072 2.952h.72l.072-2.952V9.624h-.864v2.472z"
        fill={color}
      />
    </Svg>
  );
}

export default WarningUltraLight;
