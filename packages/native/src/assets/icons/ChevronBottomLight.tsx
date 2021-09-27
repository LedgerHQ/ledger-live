import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronBottomLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.02 7.164l-.84.84 8.808 8.832 8.832-8.832-.84-.84-7.992 7.968L4.02 7.164z"
        fill={color}
      />
    </Svg>
  );
}

export default ChevronBottomLight;
