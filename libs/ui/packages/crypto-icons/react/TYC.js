import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#005B9F";
function TYC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M12 12.1l3.7-1.4.2-.1.8-1.5-2.8 1.1-1.9.8-3.3-1.3-1.4-.6.8 1.5.1.1 3.8 1.4z" }),
        React.createElement("path", { d: "M12 9.2L6.1 6.9l.8 1.4 5.1 2 5.1-2 .8-1.4L12 9.2zM12.3 17.1l.8-.3.8-4.8-1.6.7v4.4zM10.9 16.8l.8.3v-4.4l-1.6-.7.8 4.8z" }));
}
TYC.DefaultColor = DefaultColor;
export default TYC;
