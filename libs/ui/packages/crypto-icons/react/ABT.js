import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#3effff";
function ABT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M4.875 7.865L12 3.75l7.125 4.115v8.27L12 20.25l-7.125-4.115zm.684 7.478l2.857-1.654 1.45-2.539L5.56 8.658zm.343.593l5.776 3.337V16.08L8.65 14.345zM18.44 8.681l-4.269 2.47 1.449 2.537 2.82 1.631zm-.322-.606l-5.757-3.324v3.231l1.47 2.574zm-4.536 3.417l-.879.508 1.744 1.009zm-.34-.596l-.88-1.545v2.055zm-3.648 2.111L11.336 12l-.876-.507-.863 1.514m-.259.942l2.342 1.341v-2.696zM5.901 8.064l4.305 2.49 1.472-2.576v-3.25zm12.218 7.86l-2.727-1.577-3.03 1.755v3.148zm-3.411-1.973l-2.346-1.357v2.717l2.345-1.361m-3.91-3.053l.88.508v-2.05z" }));
}
ABT.DefaultColor = DefaultColor;
export default ABT;
//# sourceMappingURL=ABT.js.map