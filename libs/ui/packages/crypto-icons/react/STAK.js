import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#F2941B";
function STAK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M12.463 3.51h.008c1.554 1.537 3.09 3.09 4.636 4.635h3.855L12.284 20.44c-.144-1.444-.255-2.888-.382-4.33 1.257-1.809 2.548-3.6 3.805-5.4l-2.87-2.862a6.664 6.664 0 00-.085-1.01c-.094-1.104-.154-2.225-.29-3.329zM3.046 15.853c2.913-4.092 5.8-8.201 8.704-12.302l.365 4.347c-1.265 1.808-2.539 3.592-3.804 5.392.942.942 1.884 1.901 2.845 2.844.127 1.443.237 2.904.382 4.356h-.018l-4.61-4.62c-1.29.018-2.581-.008-3.872.018v-.035h.008z" }));
}
STAK.DefaultColor = DefaultColor;
export default STAK;
