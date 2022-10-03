import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#242424";
function EDO({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M9.795 17.905l2.012-2.022 2.02 2.023-1.288 1.291a1.035 1.035 0 01-1.463 0l-1.281-1.291zm5.213-6.931l-2.02-2.023 2.02-2.022 2.02 2.022-2.02 2.023zm-.502 6.272l-2.02-2.022 5.422-5.432 1.289 1.29c.404.406.404 1.06 0 1.465l-4.691 4.7zm-5.553-.208l-2.019-2.023 5.414-5.422 2.019 2.022-5.414 5.423zm-2.866-2.85l-1.29-1.292a1.037 1.037 0 01.01-1.464l1.289-1.291 2.02 2.023-2.029 2.024zm8.075-8.091L8.74 11.525 6.72 9.503l4.691-4.7a1.032 1.032 0 011.463 0l1.288 1.294z" }));
}
EDO.DefaultColor = DefaultColor;
export default EDO;
