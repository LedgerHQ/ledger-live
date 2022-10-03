import * as React from "react";
import { Path } from "react-native-svg";
import Svg from "./StyledSvg";
const DefaultColor = "#333";
function PURA({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement(Path, { d: "M8.394 5.625h5.823c1.611.095 3.383.758 4.095 2.295.89 1.958.448 4.712-1.558 5.83-1.85 1.057-4.062.64-6.093.727-.054 1 .225 2.165-.472 3.01-.28.406-1.567.888-1.567.888s-.118-1.087-.162-3.533c-.028-.675.083-1.432.662-1.87.68-.584 1.641-.402 2.466-.432 1.245-.033 2.553.158 3.735-.322 1.734-.71 1.797-3.604.05-4.333-1.785-.692-3.755-.063-5.588-.445-.833-.233-1.207-1.053-1.39-1.815zM5.25 8.947c1.523.028 3.048-.053 4.568.039 1.104.084 1.83 1.085 1.945 2.108-1.533-.008-3.07.049-4.603-.019-.942-.054-1.638-.82-1.91-1.663v-.464z" }));
}
PURA.DefaultColor = DefaultColor;
export default PURA;
