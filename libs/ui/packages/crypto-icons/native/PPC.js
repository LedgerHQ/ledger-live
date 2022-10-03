import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function PPC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M6.75 5.625c9.07.335 12.567 5.78 10.811 10.637-.497 1.352-1.026 2.093-2.137 2.863.045-.195.091-.39.127-.59.657-3.79-.588-8.35-6.684-10.87 4.85 2.886 6.806 8.021 4.545 11.336-3.85.605-6.662-2.682-6.662-6.47V5.626z" }),
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M6.375 5.25c9.07.335 12.567 5.78 10.811 10.637-.497 1.352-1.026 2.093-2.137 2.863.045-.195.091-.39.127-.59.657-3.79-.588-8.35-6.684-10.87 4.85 2.886 6.807 8.021 4.545 11.336-3.85.605-6.662-2.682-6.662-6.47V5.25z" }));
}
PPC.DefaultColor = DefaultColor;
export default PPC;
