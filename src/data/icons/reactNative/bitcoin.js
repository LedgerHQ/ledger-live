//@flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function Bitcoin({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M7.62 0h1.7v3.058h-1.7V0zm1.7 0v3.058h-1.7V0h1.7zM7.813 12.942h1.7V16h-1.7v-3.058zm1.7 0V16h-1.7v-3.058h1.7zM4.406 0h1.7v3.058h-1.7V0zm1.7 0v3.058h-1.7V0h1.7zM4.6 12.942h1.7V16H4.6v-3.058zm1.7 0V16H4.6v-3.058h1.7zM2.666 8.813V1.95h.85l6.139.002c1.807.11 3.212 1.566 3.118 3.254l-.002.279c.111 1.744-1.298 3.217-3.168 3.328H2.666zm.85 0l.85-.85v4.32h5.608c.95-.025 1.676-.727 1.659-1.557v-.37c.019-.814-.707-1.518-1.637-1.543h-6.48zm7.557-3.275l.001-.378c.042-.77-.62-1.457-1.471-1.51H4.366v3.463h5.205c.899-.063 1.552-.753 1.502-1.575zM4.366 7.113l5.186.002.467-.002c1.86.05 3.355 1.5 3.314 3.262v.334c.036 1.779-1.458 3.224-3.337 3.273h-7.33V7.113h1.7zm0 0v.85l-.85-.85h.85z"
      />
    </Svg>
  );
}
