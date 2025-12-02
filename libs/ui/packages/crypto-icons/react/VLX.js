import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#000";
function VLX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", strokeMiterlimit: 10, fill: color },
        React.createElement("path", { d: "M15.384 10.05l-3.38 5.851-3.387-5.852zm3.383-1.956H5.233l6.772 11.708L18.767 8.1zM2.977 4.198l1.128 1.955h15.79l1.128-1.955z" }));
}
VLX.DefaultColor = DefaultColor;
export default VLX;
//# sourceMappingURL=VLX.js.map