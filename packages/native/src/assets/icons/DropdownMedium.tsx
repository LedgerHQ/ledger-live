import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropdownMedium({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15.54l5.712-5.736-1.344-1.344L12 12.804 7.632 8.46 6.288 9.804 12 15.54z"
        fill={color}
      />
    </Svg>
  );
}

export default DropdownMedium;
