import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function DropupRegular({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8.652l5.592 5.592-1.104 1.104L12 10.86l-4.488 4.488-1.104-1.104L12 8.652z"
        fill={color}
      />
    </Svg>
  );
}

export default DropupRegular;
