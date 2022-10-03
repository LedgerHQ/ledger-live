import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#630";
function PAYX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M8.842 7.723l.938-2.297 6.421.023c.938.07 2.063.07 2.695.868.75.867.586 2.109.211 3.093a6.534 6.534 0 01-4.758 4.266c-1.546.235-3.117.164-4.687.164.313-.763.625-1.528.937-2.297 1.29 0 2.602.07 3.915-.14 1.195-.305 2.297-1.5 2.11-2.813-.118-.562-.75-.82-1.29-.82-2.156-.094-4.313 0-6.469-.048h-.023v.001z" }),
        React.createElement(Path, { d: "M6.076 8.355h7.617l-1.007 2.602H5.044L6.076 8.38v-.023zm1.219 3.188h2.648L7.18 18.574H4.576l2.742-7.031h-.023z" }));
}
PAYX.DefaultColor = DefaultColor;
export default PAYX;
