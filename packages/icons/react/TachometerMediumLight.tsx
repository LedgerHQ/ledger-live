import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerMediumLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.164 19.86h15.648a9.63 9.63 0 001.992-5.856c0-4.704-3.336-8.664-7.776-9.576v1.224c3.768.912 6.576 4.32 6.576 8.352 0 1.704-.528 3.312-1.392 4.656H4.788a8.43 8.43 0 01-1.392-4.656 8.597 8.597 0 016.552-8.352V4.428C5.532 5.34 2.196 9.3 2.196 14.004c0 2.184.744 4.248 1.968 5.856zm7.224-5.856c0 .336.264.6.6.6.336 0 .6-.264.6-.6V4.14h-1.2v9.864z"  /></Svg>;
}

export default TachometerMediumLight;