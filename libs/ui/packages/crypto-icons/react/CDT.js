import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#272731";
function CDT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M18.75 12.023a8.262 8.262 0 01-2.39 5.818 8.122 8.122 0 01-5.77 2.409v-2.102c2.961.01 5.494-2.142 5.988-5.086h-2.917c.115-.342.174-.7.175-1.062a3.585 3.585 0 00-.175-1.062h2.917c-.501-2.94-3.03-5.088-5.988-5.087V3.75c4.506.043 8.141 3.729 8.16 8.273zm-5.44 1.769h2.303c-.851 2.478-3.354 3.975-5.92 3.54-2.564-.437-4.443-2.676-4.443-5.3 0-2.623 1.879-4.862 4.444-5.298 2.565-.435 5.067 1.061 5.92 3.54h-2.305a3.54 3.54 0 00-.986-.995 3.224 3.224 0 00-4.474.995 3.283 3.283 0 00.987 4.512 3.224 3.224 0 004.473-.995z" }));
}
CDT.DefaultColor = DefaultColor;
export default CDT;
