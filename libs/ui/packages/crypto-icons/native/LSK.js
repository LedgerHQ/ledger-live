import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#0D4EA0";
function LSK({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M10.687 19.093c-.01.011-.032.021-.042.032H9.48c-.021 0-.032-.01-.042-.021l-3.431-3.876a.067.067 0 010-.062l4.273-7.377c.021-.03.073-.03.094 0l1.195 2.069c.01.01.01.031 0 .053l-2.89 4.983c-.01.02 0 .041.01.063l1.726 1.943a.08.08 0 00.042.02h2.038c.052 0 .073.053.041.084l-1.85 2.09zm1.267-14.186c.022-.043.074-.043.084 0l5.958 10.237c.01.022 0 .043-.01.063l-3.431 3.876a.079.079 0 01-.042.021h-2.787c-.052 0-.072-.052-.04-.083l1.86-2.11 1.747-1.965c.02-.021.02-.042.01-.062l-3.307-5.705-1.247-2.152c-.01-.01-.01-.031 0-.053l1.205-2.067z" }));
}
LSK.DefaultColor = DefaultColor;
export default LSK;
