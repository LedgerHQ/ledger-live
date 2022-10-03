import * as React from "react";
import Svg from "./StyledSvg";
const DefaultColor = "#fff";
function ELIX({ size = 16, color = DefaultColor }) {
    return React.createElement(Svg, { width: size, height: size, viewBox: "0 0 24 24", fill: color },
        React.createElement("path", { d: "M7.573 17.702l.001-.003 2.391-5.712-2.392-5.711 4.413 5.711-4.41 5.711-.003.004zm8.832 0l-.003-.004-4.411-5.71 4.414-5.712-2.393 5.711 2.391 5.712.002.003z" }),
        React.createElement("path", { d: "M11.989 11.988v3.98L7.57 17.7l4.418-5.715v-3.98l4.417-1.732-4.417 5.715z", fillOpacity: 0.8 }),
        React.createElement("path", { d: "M11.989 15.967v3.489L7.57 17.698l4.418-1.737v-3.973L7.57 6.273l4.418 1.732V4.517l4.417 1.757-4.417 1.737v3.974l4.417 5.715-4.417-1.732z", fillOpacity: 0.5 }),
        React.createElement("path", { d: "M7.571 6.274l4.418-1.757v3.494L7.57 6.274zm8.835 11.424l-4.417 1.758V15.96l4.417 1.737z", fillOpacity: 0.145 }),
        React.createElement("path", { d: "M7.584 17.716l.001-.003L9.976 12 7.584 6.289l4.414 5.712-4.411 5.711-.003.004zm8.832 0l-.003-.004-4.41-5.711 4.413-5.712-2.393 5.712 2.392 5.712.001.003z" }),
        React.createElement("path", { d: "M12 12.002v3.979l-4.418 1.732L12 11.998V8.02l4.418-1.732L12 12.002z", fillOpacity: 0.8 }),
        React.createElement("path", { d: "M12 15.981v3.488l-4.418-1.758L12 15.975v-3.973L7.582 6.287 12 8.019V4.531l4.418 1.757L12 8.024V12l4.418 5.714L12 15.982z", fillOpacity: 0.5 }),
        React.createElement("path", { d: "M7.582 6.288L12 4.531v3.493L7.582 6.288zm8.835 11.423L12 19.47v-3.494l4.418 1.736z", fillOpacity: 0.1 }));
}
ELIX.DefaultColor = DefaultColor;
export default ELIX;
