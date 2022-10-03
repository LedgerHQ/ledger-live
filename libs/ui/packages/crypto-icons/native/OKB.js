import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#2D60E0";
function OKB({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { opacity: 0.15, d: "M12 11.245A3.623 3.623 0 1012 4a3.623 3.623 0 000 7.245z" }),
        React.createElement(Path, { opacity: 0.4, d: "M16.378 15.623a3.623 3.623 0 100-7.246 3.623 3.623 0 000 7.246z" }),
        React.createElement(Path, { opacity: 0.6, d: "M12 20a3.623 3.623 0 100-7.245A3.623 3.623 0 0012 20z" }),
        React.createElement(Path, { opacity: 0.85, d: "M7.623 15.623a3.623 3.623 0 100-7.246 3.623 3.623 0 000 7.246z" }));
}
OKB.DefaultColor = DefaultColor;
export default OKB;
