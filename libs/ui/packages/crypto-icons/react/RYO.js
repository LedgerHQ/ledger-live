import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#3D58B0";
function RYO({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M12 3.011c-4.957 0-8.989 4.032-8.989 8.99 0 4.957 4.032 8.988 8.99 8.988 4.957 0 8.988-4.032 8.988-8.988 0-4.958-4.032-8.99-8.988-8.99zm0 1.224a7.756 7.756 0 017.765 7.766 7.754 7.754 0 01-7.764 7.764 7.755 7.755 0 01-7.766-7.764 7.756 7.756 0 017.766-7.766z" }),
        React.createElement("path", { d: "M8.66 8.681v6.638h6.68V8.68H8.66zM9.749 9.77h4.503v4.462H9.75V9.77z" }));
}
RYO.DefaultColor = DefaultColor;
export default RYO;
