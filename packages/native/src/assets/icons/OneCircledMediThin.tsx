import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function OneCircledMediThin({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.6 11.904v4.56h.48v-8.88h-1.272l-3.264 3.048v.648L12 8.064h.6v3.84zM5.76 20.88h12.48v-.48H5.76v.48zm0-17.28h12.48v-.48H5.76v.48z"
        fill={color}
      />
    </Svg>
  );
}

export default OneCircledMediThin;
