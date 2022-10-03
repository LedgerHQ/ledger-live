import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#4099CD";
function NXS({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M.771 15.353c.454-1.323 1.328-2.756 2.546-4.17a1.5 1.5 0 012.091-2.108 26.23 26.23 0 013.078-2.331c5.2-3.378 10.697-4.455 13.377-2.849a11.925 11.925 0 011.366 4.677c-.866 2.834-3.724 6.219-7.798 8.865-2.81 1.825-5.708 2.979-8.2 3.4a12.04 12.04 0 01-6.46-5.484zm2.812-3.896c-1.758 2.03-2.462 4.12-1.61 5.433 1.287 1.982 5.64 1.44 9.721-1.21s6.347-6.407 5.06-8.389c-1.288-1.982-5.64-1.44-9.722 1.21-.452.294-.883.601-1.288.918a1.5 1.5 0 01-2.16 2.037z" }));
}
NXS.DefaultColor = DefaultColor;
export default NXS;
