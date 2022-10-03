import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#F4AE95";
function DLT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M11.855 7.468l-4.57 9.756h7.587a.55.55 0 01.505.341l.008.019a.481.481 0 01-.023.42.72.72 0 01-.626.371H6.672a.62.62 0 01-.35-.109l-.042-.028a.655.655 0 01-.217-.818l5.392-11.362a.929.929 0 01.235-.307.519.519 0 01.67-.008.372.372 0 01.1.13l5.47 11.438a.71.71 0 01.044.5.427.427 0 01-.411.317H17.5a.657.657 0 01-.596-.387L12.187 7.47a.184.184 0 00-.165-.109.183.183 0 00-.167.107z" }));
}
DLT.DefaultColor = DefaultColor;
export default DLT;
