import React from "react";
import Svg, { Path } from "react-native-svg";

const Clock = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11 6.00012C11 8.76155 8.76142 11.0001 6 11.0001C3.23858 11.0001 1 8.76155 1 6.00012C1 3.2387 3.23858 1.00012 6 1.00012C8.76142 1.00012 11 3.2387 11 6.00012ZM12 6.00012C12 9.31383 9.31371 12.0001 6 12.0001C2.68629 12.0001 0 9.31383 0 6.00012C0 2.68641 2.68629 0.00012207 6 0.00012207C9.31371 0.00012207 12 2.68641 12 6.00012ZM5.5 1.90921V6.00012V6.20723L5.64645 6.35368L7.28281 7.99004L7.98992 7.28293L6.5 5.79302V1.90921H5.5Z"
      fill={color}
    />
  </Svg>
);

export default Clock;
