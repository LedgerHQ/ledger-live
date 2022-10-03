import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#EF0027";
function TRX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M16.449 7.435L5.625 5.443l5.696 14.334 7.938-9.67-2.81-2.672zm-.174.877l1.656 1.575-4.529.82 2.873-2.395zm-3.856 2.23L7.644 6.584l7.802 1.435-3.028 2.523zm-.34.7l-.779 6.435L7.104 7.115l4.975 4.127zm.72.342l5.015-.908-5.752 7.007.737-6.1z" }),
        React.createElement(Path, { d: "M16.007 6.825L5.183 4.833l5.697 14.334 7.937-9.67-2.81-2.672zm-.174.878l1.656 1.574-4.528.82 2.872-2.394zm-3.856 2.23l-4.773-3.96 7.801 1.436-3.028 2.523zm-.34.7l-.779 6.435L6.662 6.506l4.975 4.126zm.72.341l5.015-.908-5.752 7.008.737-6.1z" }));
}
TRX.DefaultColor = DefaultColor;
export default TRX;
