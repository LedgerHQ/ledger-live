import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function ExportMedium({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.64 20.64h18.72v-7.2h-1.92v5.28H4.56v-5.28H2.64v7.2zM7.656 7.704l1.2 1.176 1.056-1.056a29.8 29.8 0 001.176-1.248v9.744h1.824V6.528c.408.456.792.888 1.2 1.296l1.08 1.056 1.176-1.176L12 3.36 7.656 7.704z"
        fill={color}
      />
    </Svg>
  );
}

export default ExportMedium;
