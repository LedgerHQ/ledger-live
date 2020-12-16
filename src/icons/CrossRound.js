// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function AccountsIcon({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 50 50" width={size} height={size}>
      <Path
        fill={color}
        fillRule="evenodd"
        d="M47.5 25C47.5 37.4264 37.4264 47.5 25 47.5C12.5736 47.5 2.5 37.4264 2.5 25C2.5 12.5736 12.5736 2.5 25 2.5C37.4264 2.5 47.5 12.5736 47.5 25ZM50 25C50 38.8071 38.8071 50 25 50C11.1929 50 0 38.8071 0 25C0 11.1929 11.1929 0 25 0C38.8071 0 50 11.1929 50 25ZM16.6437 14.8755L25.0004 23.2322L33.3572 14.8755L35.1249 16.6433L26.7682 25L35.1249 33.3567L33.3572 35.1245L25.0004 26.7678L16.6437 35.1245L14.876 33.3567L23.2327 25L14.876 16.6433L16.6437 14.8755Z"
      />
    </Svg>
  );
}
