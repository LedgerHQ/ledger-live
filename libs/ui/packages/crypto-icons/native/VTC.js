import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#048657";
function VTC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M1.627 12.238l1.462-1.666h5.204l3.197 4.079 8.366-11.59c.514.464.981.976 1.395 1.53.432.574.808 1.189 1.122 1.835L12.102 20.633c-.194.204-.398.306-.612.306-.215 0-.43-.102-.646-.306l-6.496-8.396H1.627v.001z" }));
}
VTC.DefaultColor = DefaultColor;
export default VTC;
