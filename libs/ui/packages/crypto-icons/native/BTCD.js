import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#F60";
function BTCD({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M12.809 14.517c3.81-1.175 2.45-5.125 0-5.275.622 0 1.13-1.783 1.13-3.992 5.983.425 8.793 10.283-.18 13.367.058-.8-.27-3.034-.95-4.1zM4.5 13.35v-4.1h.008c2.163-.008 3.908-1.8 3.901-3.992h4.17c0 4.475-3.613 8.092-8.079 8.092zm5.465-.742c2.475 2.034 2.615 5.459 2.615 6.142H8.409c0-2.267-1.475-4.1-3.302-4.1 3.097-.5 3.728-1.025 4.858-2.042z" }));
}
BTCD.DefaultColor = DefaultColor;
export default BTCD;
