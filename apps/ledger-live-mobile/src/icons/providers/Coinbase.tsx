import * as React from "react";
import { ColorValue } from "react-native";
import Svg, { Path, Rect, SvgProps } from "react-native-svg";

type Props = SvgProps & { size?: number; outline?: ColorValue };

const BASE_SIZE = 32;

export function Coinbase({ size = BASE_SIZE, outline = "white", ...props }: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none" {...props}>
      <Rect width="60" height="60" rx="18" fill="#0052FF" />
      <Rect x="0.5" y="0.5" width="59" height="59" rx="17.5" stroke={outline} strokeOpacity={0.1} />
      <Path
        d="M30.3131 19.0067C34.7076 19.0067 38.1941 21.7283 39.5177 25.7763H48.375C46.7699 17.1228 39.6572 11.2595 30.3842 11.2595C19.8534 11.2595 11.625 19.2868 11.625 30.0357C11.625 40.7846 19.6455 48.7405 30.3842 48.7405C39.4493 48.7405 46.7014 42.8773 48.3066 34.1524H39.5177C38.2626 38.2004 34.776 40.9933 30.3816 40.9933C24.3136 40.9933 20.0612 36.3164 20.0612 30.0357C20.0639 23.6836 24.2478 19.0067 30.3131 19.0067Z"
        fill="white"
      />
    </Svg>
  );
}
