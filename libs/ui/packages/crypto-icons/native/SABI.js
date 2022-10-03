import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function SABI({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M9.73 3.033H4.391A11.712 11.712 0 0112 .24C18.495.24 23.76 5.505 23.76 12S18.495 23.76 12 23.76c-2.585 0-4.975-.834-6.916-2.248H9.73a1.058 1.058 0 000-2.116H2.856a11.786 11.786 0 01-1.118-1.649h11.599a1.058 1.058 0 000-2.116H.81a11.68 11.68 0 01-.422-1.755H4.09a1.058 1.058 0 000-2.116H.242c.017-.824.118-1.627.296-2.401h12.826a1.058 1.058 0 000-2.116H1.242C1.57 6.5 1.972 5.8 2.44 5.149h7.29a1.058 1.058 0 000-2.116zm-.152 9.785c0 .584.474 1.058 1.058 1.058h8.728a1.058 1.058 0 000-2.116h-8.728c-.584 0-1.058.473-1.058 1.058zm-2.25-1.058a1.059 1.059 0 10-.001 2.117 1.059 1.059 0 000-2.117zm5.7-8.727a1.059 1.059 0 10-.002 2.117 1.059 1.059 0 00.001-2.117zm0 16.363a1.059 1.059 0 10-.002 2.117 1.059 1.059 0 00.001-2.117z", stroke: "#000", strokeWidth: 0.48 }));
}
SABI.DefaultColor = DefaultColor;
export default SABI;
