import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropupLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8.844l5.472 5.448-.864.864L12 10.524l-4.608 4.632-.864-.864L12 8.844z"
        fill={color}
      />
    </Svg>
  );
}

export default DropupLight;
