import React, { memo } from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};

const DropdownArrow: React.FC<Props> = ({ size = 16, color }) => (
  <Svg viewBox="0 0 10 6" width={size} height={size}>
    <Path
      fill={color}
      d="M5.00006 5.99994L9.28406 1.69794L8.27606 0.689941L5.00006 3.94794L1.72406 0.689941L0.716064 1.69794L5.00006 5.99994Z"
    />
  </Svg>
);

export default memo(DropdownArrow);
