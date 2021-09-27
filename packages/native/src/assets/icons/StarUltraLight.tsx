import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function StarUltraLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.64 21.816L12 17.16l6.36 4.656-2.448-7.56 6.408-4.704h-7.944L12 2.184 9.624 9.552H1.68l6.384 4.704-2.424 7.56zM4.056 10.32H10.2L12 4.728l1.8 5.592h6.144L15 13.968l1.872 5.784L12 16.2l-4.896 3.576 1.872-5.808-4.92-3.648z"
        fill={color}
      />
    </Svg>
  );
}

export default StarUltraLight;
