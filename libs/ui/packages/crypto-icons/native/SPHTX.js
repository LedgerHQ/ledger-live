import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#00b098";
function SPHTX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M4.5 8.918v-.267h6.313v.267zm0-.776v-.267h6.313v.267zm2.662 7.98v-6.67h.254v6.67zm.736 0v-6.67h.252v6.67zm11.424-.546l-2.849-3.01.178-.188 2.849 3.009zm-6.933-7.701l2.849 3.01-.179.188-2.848-3.009zm6.413 8.25l-2.849-3.01.179-.189 2.848 3.01zM11.87 8.424l2.849 3.009-.18.189-2.848-3.009zM15.936 12l.18-.189 3.206-3.387.178.189L16.294 12l-.179.189-.34.36-.18.189-3.205 3.387-.179-.189 3.207-3.387.178-.189zm-.34-.738l3.206-3.387.179.189-3.206 3.387-.179.189-.34.36-.18.189-3.205 3.387-.18-.189L14.899 12l.178-.189.342-.36z" }));
}
SPHTX.DefaultColor = DefaultColor;
export default SPHTX;
//# sourceMappingURL=SPHTX.js.map