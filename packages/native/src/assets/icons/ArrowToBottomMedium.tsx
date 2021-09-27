import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowToBottomMedium({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 17.04l5.496-5.496-1.176-1.176-2.232 2.208c-.384.408-.792.84-1.176 1.272V3.12h-1.824v10.704a29.775 29.775 0 00-1.176-1.248l-2.208-2.208-1.2 1.176L12 17.04zm-8.4 3.84h16.8v-1.92H3.6v1.92z"
        fill={color}
      />
    </Svg>
  );
}

export default ArrowToBottomMedium;
