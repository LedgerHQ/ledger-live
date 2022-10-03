import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#1C1C1C";
function IOST({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M18.375 8.25v7.5L12 19.5l-6.375-3.75v-7.5L12 4.5l6.375 3.75zm-6.576 4.055l-.592.35 1.106.647.59-.347 1.573.926-2.348 1.38-4.871-2.84-.02 1.383 4.894 2.842 4.703-2.765-2.756-1.622.555-.327-1.107-.647-.551.326-.772-.455.675-.4-1.107-.647-.673.398-1.315-.774 2.348-1.381 3.245 1.897 1.19-.704-4.438-2.578-4.702 2.766 2.496 1.469-.47.277 1.107.648.467-.276.773.454z" }));
}
IOST.DefaultColor = DefaultColor;
export default IOST;
