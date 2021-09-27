import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function DashboardUltraLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.36 19.992h17.28v-.84H4.2v-15h-.84v15.84zm3.792-3.144h.864v-5.64h-.864v5.64zm3.984 0h.888V6.384h-.888v10.464zm4.008 0h.864V8.784h-.864v8.064zm3.984 0h.888V4.008h-.888v12.84z"
        fill={color}
      />
    </Svg>
  );
}

export default DashboardUltraLight;
