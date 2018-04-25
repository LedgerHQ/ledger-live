//@flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function Dash({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M4.89 3.667l-.509 1.744-1.6-.467L3.64 2h5.782c4.255 0 7.307 2.297 6.426 5.312l-.64 2.103c-.803 2.75-4.804 4.836-8.917 4.836H.051l1.109-3.812 1.6.466-.488 1.679H6.29c3.452 0 6.759-1.725 7.32-3.645l.64-2.103c.484-1.658-1.523-3.169-4.829-3.169H4.89zM0 8.77V7.102h6.176v1.667H0z"
      />
    </Svg>
  );
}
