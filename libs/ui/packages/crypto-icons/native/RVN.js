import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#384182";
function RVN({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M7.123 20.25L9.837 7.658l1.523 9.45-4.237 3.142zM9.89 7.586l4.123 9.532-2.582-.045-1.54-9.488v.001zm.062-.072l5.4.767-1.251 8.837-4.149-9.604zm4.245 9.468l1.217-8.62.797 1.011-2.014 7.61zM15.334 8.2l-5.27-.75L14.81 5.89l.525 2.31zm-5.295-.83l3.23-2.24 1.54.678-4.77 1.562zm-.08-.027l.623-1.192 2.634-1.056-3.257 2.248zm.623-1.245l.297-.93 2.17-.073-2.467 1.002zm.28-1.003l.7-.75 1.505.678-2.206.072zm.743-.794l1.05-.515 1.358 1.589L11.605 4.3zm1.2-.452l1.566.686-.28.848-1.286-1.534zm1.338 1.561l.29-.866.35 1.192-.64-.325zm-1.452-1.66h1.146l.568.631a.036.036 0 01-.017.058.036.036 0 01-.023 0L12.69 3.75zm1.812.722l2.332.651a.054.054 0 010 .105l-1.982.544-.35-1.3z" }));
}
RVN.DefaultColor = DefaultColor;
export default RVN;
