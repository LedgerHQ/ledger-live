import React from "react";
import Svg, { Path, Line } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};
export default function Edit({ size = 16, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 14" fill="none">
      <Path
        d="M10.9818 1.87978L10.0819 0.979828C9.69134 0.589303 9.05817 0.589303 8.66765 0.979828L4.84284 4.80463L1.16315 8.48433C1.02947 8.61801 0.936421 8.78684 0.894794 8.97125L0.449869 10.9423C0.368258 11.3039 0.694621 11.6254 1.05492 11.5385L2.99917 11.0691C3.17804 11.026 3.34153 10.9343 3.47164 10.8042L7.15701 7.1188L10.9818 3.294C11.3723 2.90347 11.3723 2.27031 10.9818 1.87978Z"
        stroke={color}
        strokeWidth="1.2"
      />
      <Line
        x1="8.06062"
        y1="1.75756"
        x2="10.2424"
        y2="3.93938"
        stroke={color}
        stroke-width="1.2"
      />
    </Svg>
  );
}
