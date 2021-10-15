import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerSlowLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.176 19.836h15.648a9.736 9.736 0 001.992-5.856A9.812 9.812 0 0012 4.164a9.656 9.656 0 00-5.328 1.584l.888.888C8.832 5.82 10.368 5.364 12 5.364c4.752 0 8.616 3.864 8.616 8.616 0 1.704-.528 3.312-1.392 4.656H4.8a8.45 8.45 0 01-1.416-4.656 8.57 8.57 0 011.272-4.464l-.864-.888a9.755 9.755 0 00-1.608 5.352c0 2.184.768 4.248 1.992 5.856zm.456-12.408l6.96 6.96c.096.12.24.192.408.192.336 0 .6-.264.6-.6a.578.578 0 00-.168-.432l-6.96-6.96-.84.84z"  /></Svg>;
}

export default TachometerSlowLight;