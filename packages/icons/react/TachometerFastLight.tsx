import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFastLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.164 19.836h15.648a9.63 9.63 0 001.992-5.856 9.736 9.736 0 00-1.584-5.352l-.888.888a8.353 8.353 0 011.272 4.464c0 1.704-.528 3.312-1.392 4.656H4.788a8.43 8.43 0 01-1.392-4.656c0-4.752 3.84-8.616 8.592-8.616 1.632 0 3.168.456 4.464 1.272l.888-.888a9.736 9.736 0 00-5.352-1.584c-5.4 0-9.792 4.416-9.792 9.816 0 2.184.744 4.248 1.968 5.856zm7.224-5.856c0 .336.264.6.6.6a.69.69 0 00.432-.168l6.96-6.96-.864-.864-6.96 6.96a.69.69 0 00-.168.432z"  /></Svg>;
}

export default TachometerFastLight;