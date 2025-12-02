import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function TON({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 56 56", fill: color },
        React.createElement(Path, { d: "M37.56 15.628H18.44c-3.516 0-5.745 3.792-3.976 6.858l11.801 20.455c.77 1.335 2.7 1.335 3.47 0l11.804-20.455c1.767-3.06-.462-6.858-3.975-6.858zM26.255 36.807l-2.57-4.974-6.202-11.092c-.409-.71.096-1.62.953-1.62h7.816V36.81zM38.51 20.739l-6.2 11.096-2.57 4.972V19.119h7.817c.857 0 1.362.91.953 1.62" }));
}
TON.DefaultColor = DefaultColor;
export default TON;
//# sourceMappingURL=TON.js.map