import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#f89022";
function WAX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", d: "M21 13.847h-1.773l-1.258-1.077-1.253 1.072h-1.499l-.716-.87h-2.469l.625-.772h1.214l-.925-1.13L9.719 15H8.22l.934-1.142h-1.56l-.844-2.365-.837 2.348H4.33L3 10.156h1.215l.894 2.51.891-2.5h1.5l.889 2.493.888-2.494h1.219l-1.341 3.692.298-.364 2.739-3.334H13.7l2.279 2.781 1.096-.943L13.605 9h1.781zm-1.759-2.23l-.836-.717.835-.71 1.687.001z", clipRule: "evenodd" }));
}
WAX.DefaultColor = DefaultColor;
export default WAX;
//# sourceMappingURL=WAX.js.map