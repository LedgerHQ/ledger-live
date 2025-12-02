import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#ef0027";
function TRX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M16.449 7.435L5.625 5.443l5.696 14.334 7.938-9.67zm-.174.877l1.656 1.575-4.529.82zm-3.856 2.23L7.646 6.584l7.801 1.435zm-.34.7l-.779 6.435L7.104 7.115zm.72.342l5.015-.908-5.752 7.007z" }),
        React.createElement("path", { d: "M16.007 6.825L5.183 4.833l5.697 14.334 7.937-9.67zm-.174.878l1.656 1.574-4.528.82zm-3.856 2.23l-4.773-3.96 7.801 1.436zm-.34.7l-.779 6.435L6.663 6.506zm.72.341l5.015-.908-5.752 7.008z" }));
}
TRX.DefaultColor = DefaultColor;
export default TRX;
//# sourceMappingURL=TRX.js.map