import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#f28f01";
function NLC2({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { fillRule: "evenodd", d: "M13.613 10.29l-1.455-2.863q.454-.991.454-1.121 0-.464-.611-.681h4.46q-.824.37-1.465 1.857zm-2.187 4.445l-.678 1.38h4.002q2.72 0 3.636-1.02l-2.139 3.28H5.31q1.77-.34 3.574-4.27.607-1.21 1.115-2.231zm-7.676.453c.886-.526 4.125-6.13 4.125-7.706q0-.557-.672-1.052h3.483l3.025 5.941 2.934-5.941h3.605c-1.528.402-4.552 7.61-4.552 8.448q0 .247.091.31h-3.178L9.891 9.74l-2.688 5.447z", clipRule: "evenodd" }));
}
NLC2.DefaultColor = DefaultColor;
export default NLC2;
//# sourceMappingURL=NLC2.js.map