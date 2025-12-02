import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#f80000";
function NGC({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M15 12.632L9.978 19.5l.185-5.58H9l.476-4.9 5.313-.732-1.745 4.444zm-4.123 4.873v-1.312a.18.18 0 00-.185-.178.18.18 0 00-.185.177v1.313a.18.18 0 00.185.177.18.18 0 00.184-.177m-1.375-3.964h1.058l-.049 2.02c0 .053.02.104.06.142s.092.06.147.06h.01a.203.203 0 00.206-.194l.048-2.383H9.925l.354-3.914a.16.16 0 00-.044-.123.17.17 0 00-.125-.053h-.03a.167.167 0 00-.17.148zm0-4.95l1.957-1.616c.104-1.616-.953-1.869-.953-1.869l.159-.606c1.745.505 1.48 2.424 1.48 2.424l2.538 1.06z" }));
}
NGC.DefaultColor = DefaultColor;
export default NGC;
//# sourceMappingURL=NGC.js.map