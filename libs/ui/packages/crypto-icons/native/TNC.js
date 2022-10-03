import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#FF439B";
function TNC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M13.67 11.103l4.224 7.272H6.184l1.403-2.327 6.309.001-1.599-2.61 1.372-2.336zm-4.313 1.692l4.295-7.14L19.5 15.5h-2.808l-3.09-5.37-1.5 2.666-2.745-.001zm3.664 2.714L4.5 15.47l5.855-9.844 1.395 2.36-3.227 5.188h3.125l1.373 2.336z" }));
}
TNC.DefaultColor = DefaultColor;
export default TNC;
