import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerSlowUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.272 19.572h15.48a9.634 9.634 0 001.8-5.568c0-5.28-4.272-9.576-9.552-9.576-1.992 0-3.864.648-5.424 1.704l.624.6A8.65 8.65 0 0112 5.268c4.824 0 8.712 3.912 8.712 8.736 0 1.728-.528 3.36-1.416 4.728H4.704a8.689 8.689 0 01-1.416-4.728c0-1.776.528-3.432 1.464-4.8l-.624-.624a9.61 9.61 0 00-1.68 5.424c0 2.064.696 4.032 1.824 5.568zM4.92 7.524l6.792 6.768c.072.096.168.12.288.12.24 0 .432-.168.432-.408a.342.342 0 00-.144-.288L5.52 6.924l-.6.6z"  /></Svg>;
}

export default TachometerSlowUltraLight;