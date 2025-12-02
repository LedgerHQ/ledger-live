import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#141414";
function KAVA({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color },
        React.createElement(Path, { d: "M7.92 4.18v15.638H5.194V4.18zm7.464 15.64l-5.98-7.821 5.98-7.817h3.422L12.909 12l5.897 7.82z" }));
}
KAVA.DefaultColor = DefaultColor;
export default KAVA;
//# sourceMappingURL=KAVA.js.map