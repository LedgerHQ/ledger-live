//@flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function Dogecoin({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M5.293 13.442H8.67c2.656 0 4.786-1.928 4.77-4.246V6.707c0-2.316-2.133-4.246-4.77-4.246H5.293v10.981zm3.376 1.661H3.632V.8h5.037c3.531 0 6.43 2.646 6.43 5.907V9.19c.024 3.266-2.877 5.914-6.43 5.914zM.6 8.883V7.02h8.397v1.861H.6z"
      />
    </Svg>
  );
}
