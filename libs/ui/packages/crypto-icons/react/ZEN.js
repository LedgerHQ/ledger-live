import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#00eaab";
function ZEN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M18.657 7.226l-1.335 2.078c.425.835.646 1.759.642 2.696 0 3.3-2.67 5.957-5.958 5.957a5.8 5.8 0 01-2.682-.642l-2.091 1.348a8.2 8.2 0 004.76 1.537 8.2 8.2 0 008.2-8.2 8.1 8.1 0 00-1.536-4.774" }),
        React.createElement("path", { d: "M12.006 16.093a4.11 4.11 0 004.043-3.363 9.36 9.36 0 00-7.457 1.55 4.1 4.1 0 003.414 1.813" }),
        React.createElement("path", { d: "M14.022 11.773c.717 0 1.41.075 2.09.227a4.12 4.12 0 00-4.118-4.119 4.11 4.11 0 00-4.068 4.672c-1.033.795-1.524 1.412-1.55 1.437a5.953 5.953 0 015.617-7.935c.97 0 1.877.226 2.683.642l2.079-1.347a8 8 0 00-4.749-1.55 8.19 8.19 0 00-8.2 8.2c0 1.826.593 3.502 1.6 4.861a9.7 9.7 0 011.398-1.927s.807-.843 1.424-1.271a9.78 9.78 0 015.794-1.89" }));
}
ZEN.DefaultColor = DefaultColor;
export default ZEN;
//# sourceMappingURL=ZEN.js.map