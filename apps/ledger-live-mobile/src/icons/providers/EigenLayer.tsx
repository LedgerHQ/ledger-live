import * as React from "react";
import { ColorValue } from "react-native";
import Svg, { Rect, Path, SvgProps } from "react-native-svg";

type Props = SvgProps & { size?: number; outline?: ColorValue };

export function EigenLayer({ size = 32, outline = "black", ...props }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...props}>
      <Rect width="32" height="32" rx="8" fill="#F1F1F1" />
      <Rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke={outline} strokeOpacity="0.2" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.39999 6.3999H11.8461V21.456H14.6154V15.9769H17.3846V21.456H22.8308V25.5999H17.3846H14.6154H11.8461H6.39999V21.456V6.3999ZM17.3846 7.7812L17.3846 10.4977L17.3846 15.9769H20.1077H22.8308V10.4977H20.1077V7.7812V6.3999H17.3846H14.6154V7.7812H17.3846ZM22.8308 6.3999H25.6V10.4977H22.8308V6.3999Z"
        fill="#1A0C6D"
      />
    </Svg>
  );
}
