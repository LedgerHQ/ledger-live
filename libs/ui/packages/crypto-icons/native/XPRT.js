import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#e50913";
function XPRT({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 512 512", fill: color },
        React.createElement(Path, { d: "M345.171 132.464h-171V170h171z" }),
        React.createElement(Path, { d: "M348.443 265.394q0 19.844-9.109 36.435-9.108 16.266-27.977 26.351-18.868 10.085-46.846 10.085h-34.483v81.98h-55.63V191.872h90.113q27.327 0 46.195 9.434 18.868 9.435 28.303 26.026 9.434 16.59 9.434 38.062m-88.161 28.628q15.94 0 23.748-7.483t7.808-21.145q0-13.664-7.808-21.146t-23.748-7.482h-30.254v57.256z" }));
}
XPRT.DefaultColor = DefaultColor;
export default XPRT;
//# sourceMappingURL=XPRT.js.map