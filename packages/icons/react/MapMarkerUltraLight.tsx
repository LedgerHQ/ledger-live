import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MapMarkerUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.088 16.368L12 21.648l3.912-5.28c1.704-2.28 3.072-4.536 3.072-6.912C18.96 5.04 15.6 2.352 12 2.352S5.04 5.04 5.016 9.456c0 2.376 1.368 4.632 3.072 6.912zM5.856 9.456C5.88 5.544 8.832 3.192 12 3.192s6.12 2.352 6.144 6.264c0 2.112-1.224 4.176-2.904 6.408L12 20.232l-3.24-4.368c-1.656-2.232-2.904-4.296-2.904-6.408zM8.76 9.36c0 1.8 1.44 3.24 3.24 3.24 1.8 0 3.24-1.44 3.24-3.24 0-1.776-1.44-3.24-3.24-3.24-1.8 0-3.24 1.464-3.24 3.24zm.792 0A2.443 2.443 0 0112 6.912c1.368 0 2.472 1.104 2.472 2.448A2.468 2.468 0 0112 11.832c-1.368 0-2.448-1.104-2.448-2.472z"  /></Svg>;
}

export default MapMarkerUltraLight;