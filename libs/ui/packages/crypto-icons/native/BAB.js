import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#F19F13";
function BAB({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M17.078 10.969h3.652l.27-1.5h-3.532a3.585 3.585 0 00-1.943.645c-.21-.75-2.25-.645-2.25-.645l.27-1.5h-.795l-.27 1.5h-.832l.232-1.5h-.863l-.314 1.5H9.81l-.458 2.34-.607-2.295H6.75L3 15.026h3.09l.315-1.462h-.63l1.8-2.633.675 2.648h-.675l-.293 1.447h2.296l-.188 1.005h.9l.21-1.005h.75l-.188 1.005H12l.188-1.005h1.17a2.25 2.25 0 001.402-.712 2.4 2.4 0 001.65.712h3.532l.233-1.462h-3.172c-2.183-.038-1.253-2.61.075-2.595zm-3.968 2.557h-2.34l.188-.712h2.25c.57.037.382.712-.098.712zm.353-1.92h-2.34l.187-.712h2.25c.57.037.36.742-.098.742v-.03z" }));
}
BAB.DefaultColor = DefaultColor;
export default BAB;
