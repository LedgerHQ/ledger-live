import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#74D269";
function DTA({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M18.347 10.884h.015l.013 3.724L9.992 19.5l-2.244-1.262v.002l-.014-.009-2.109-1.352V7.113l2.305-1.36.004.002L9.97 4.5l8.362 4.922.016 1.462zm-2.456 2.334l-1.754-1.004-5.856 3.445 1.72 1.022 5.89-3.463zm-2.15-1.23L10.13 9.919l-.016 4.261 3.627-2.192zm-3.61-2.524l5.806 3.398v-2.029L10.14 7.447l-.008 2.016zM7.74 17.676l.022-2.034-.013.008V8.472l-1.76-1.05v9.21l1.751 1.045zm.312-2.25l1.759-1.064V7.422l-1.759 1.05v6.955zm2.16 1.523l-.034 2.127 7.826-4.602.023-2.115-7.814 4.59zm5.846-6.438l1.821-1.04-7.841-4.578-1.805 1.044 7.825 4.574z" }));
}
DTA.DefaultColor = DefaultColor;
export default DTA;
