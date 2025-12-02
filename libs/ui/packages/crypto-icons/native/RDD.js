import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#e30613";
function RDD({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillOpacity: 0.5, fillRule: "evenodd", d: "M11.524 20.25c-4.291 0-7.771-3.445-7.771-7.693 0-4.25 3.48-7.694 7.77-7.694 4.293 0 7.772 3.445 7.772 7.693 0 4.25-3.48 7.694-7.772 7.694m1.342-13.183c1.812.742 3.114 2.138 4.038 4.019l.697-.486c-.783-1.884-2.23-3.364-4.557-4.324z", clipRule: "evenodd", opacity: 0.75 }),
        React.createElement(Path, { d: "M20.247 6.99c0-1.789-1.466-3.24-3.274-3.24-1.807 0-3.273 1.451-3.273 3.24q0 .258.04.51c1.09.635 1.965 1.546 2.665 2.683q.282.049.568.05c1.808 0 3.274-1.452 3.274-3.242" }));
}
RDD.DefaultColor = DefaultColor;
export default RDD;
//# sourceMappingURL=RDD.js.map