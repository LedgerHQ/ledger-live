import * as React from "react";
import { ColorValue } from "react-native";
import Svg, { Rect, Path, SvgProps } from "react-native-svg";

type Props = SvgProps & { size?: number; outline?: ColorValue };

export function ChorusOne({ size = 32, outline = "black", ...props }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...props}>
      <Rect width="32" height="32" rx="8" fill="#F1F1F1" />
      <Rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke={outline} strokeOpacity="0.2" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.40541 23.463L8.53816 25.5959L10.6709 23.463L8.53816 21.3301L6.40541 23.463Z"
        fill="#168F9C"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.6 8.53283L23.4672 6.3999L21.3344 8.53283L23.4672 10.6658L25.6 8.53283Z"
        fill="#168F9C"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.1353 18.131L16.0025 20.2639L13.8698 18.131L11.7371 15.9981L13.8698 13.8651L16.0025 11.7322L18.1353 13.8651L20.268 15.9981L18.1353 18.131ZM24.5335 15.998L22.4008 13.8651L20.268 11.7322L18.1353 9.59923L16.0025 7.46631L13.8698 9.59923L11.7371 11.7322L9.6043 13.8651L7.47156 15.998L9.6043 18.1309L11.7371 20.2639L13.8698 22.3968L16.0025 24.5297L18.1353 22.3968L20.268 20.2639L22.4008 18.1309L24.5335 15.998Z"
        fill="#168F9C"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.3321 23.4669L23.4648 25.5998L25.5975 23.4669L23.4648 21.334L21.3321 23.4669Z"
        fill="#168F9C"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.6655 8.53429L8.53274 6.40137L6.39999 8.53429L8.53274 10.6672L10.6655 8.53429Z"
        fill="#168F9C"
      />
    </Svg>
  );
}
