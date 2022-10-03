import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#117FC0";
function HIGHT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M19.832 7.712L13.49 18.166H9.709l2.906-4.797H9.727L6.36 18.922A8.929 8.929 0 0019.83 7.717l.002-.005zm-5.537-1.877l-2.752 4.53h2.892l3.205-5.287A8.929 8.929 0 004.17 16.283l6.34-10.447h3.785v-.001z" }));
}
HIGHT.DefaultColor = DefaultColor;
export default HIGHT;
