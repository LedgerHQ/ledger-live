import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#00bfec";
function AION({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M11.956 17.348c-2.968 0-5.382-2.4-5.382-5.348s2.415-5.347 5.382-5.347c2.968 0 5.382 2.398 5.382 5.347s-2.415 5.348-5.382 5.348m0-9.648C9.57 7.7 7.628 9.629 7.628 12s1.942 4.3 4.328 4.3 4.327-1.929 4.327-4.3-1.94-4.3-4.327-4.3m3.769-1.811a7.23 7.23 0 00-3.77-1.055 7.25 7.25 0 00-3.499.899l-.513-.915a8.31 8.31 0 018.333.178zm1.57 12.382l-.681-.8A7.14 7.14 0 0019.168 12h1.054a8.18 8.18 0 01-2.926 6.27m-5.34 1.943a8.3 8.3 0 01-5.261-1.88l.672-.806a7.25 7.25 0 004.59 1.639c1.17 0 2.286-.27 3.316-.801l.486.93a8.3 8.3 0 01-3.802.918" }),
        React.createElement(Path, { d: "M18.99 10.054a7.2 7.2 0 00-1.422-2.692l.675-.56a8 8 0 011.594 3.019zM5.123 16.467A8.06 8.06 0 013.777 12c0-2.221.885-4.296 2.492-5.841l.61.627A7.17 7.17 0 004.656 12a7.2 7.2 0 001.2 3.987z", opacity: 0.5 }));
}
AION.DefaultColor = DefaultColor;
export default AION;
//# sourceMappingURL=AION.js.map