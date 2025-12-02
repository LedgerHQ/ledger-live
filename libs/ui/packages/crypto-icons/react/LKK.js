import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#9d01eb";
function LKK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M7.504 19.875v-2.742L12 12.555l4.482 4.579v2.741L12 15.295zM3.75 10.6h6.352L12 12.555H5.648zm16.5 0l-1.898 1.954H12V4.125l1.898 1.94V10.6z" }));
}
LKK.DefaultColor = DefaultColor;
export default LKK;
//# sourceMappingURL=LKK.js.map