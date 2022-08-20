import React from "react";
import Svg, { G, Rect, Path } from "react-native-svg";

const DeviceIconBack = props => (
  <Svg width={15} height={15} {...props}>
    <G fill="#bdb3ff">
      <Rect width={15} height={15} fillOpacity={0.3} rx={2} />
      <Path d="M5 5.167V4h7.5v7H5V9.833H3.75V8.667H2.5V6.333h1.25V5.167H5zm1.25 0v1.166H7.5V5.167H6.25zM7.5 6.333V7.5h1.25V6.333H7.5zM10 5.167v1.166h1.25V5.167H10zM8.75 6.333V7.5H10V6.333H8.75zM7.5 7.5v1.167h1.25V7.5H7.5zM6.25 8.667v1.166H7.5V8.667H6.25zM8.75 7.5v1.167H10V7.5H8.75zM10 8.667v1.166h1.25V8.667H10z" />
    </G>
  </Svg>
);

export default DeviceIconBack;
