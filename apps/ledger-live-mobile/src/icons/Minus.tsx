import React, { memo } from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};

const TransferIcon: React.FC<Props> = ({ size = 12, color }) => (
  <Svg viewBox="0 0 12 2" width={size} height={size}>
    <Path
      fill={color}
      d="M11.5999 0.319824H0.399902V1.67982H11.5999V0.319824Z"
    />
  </Svg>
);

export default memo(TransferIcon);
