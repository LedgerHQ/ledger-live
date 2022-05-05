// @flow
import React from "react";
import Svg, { Path, G } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Planet({ size = 16, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <G>
        <Path
          d="M12.875 20C17.2933 20 20.875 16.4183 20.875 12C20.875 7.58172 17.2933 4 12.875 4C8.45672 4 4.875 7.58172 4.875 12C4.875 16.4183 8.45672 20 12.875 20Z"
          stroke={color}
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <Path
          d="M8.60927 12.0009C8.60927 9.64447 10.5195 7.73422 12.8759 7.73421M23.6757 5.76562C24.8236 7.75382 20.9189 12.1572 14.9544 15.6008C8.98981 19.0445 3.22407 20.2243 2.07617 18.2361"
          stroke={color}
          stroke-width="1.9"
          stroke-linejoin="round"
        />
        <Path
          d="M2.07623 18.2399C1.37623 17.0299 2.54623 14.9299 4.90623 12.6899M17.4662 5.44994C20.5762 4.51994 22.9762 4.55994 23.6762 5.75994"
          stroke={color}
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </G>
    </Svg>
  );
}
