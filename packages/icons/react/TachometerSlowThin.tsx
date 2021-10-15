import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerSlowThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.356 19.284h15.312a9.34 9.34 0 001.632-5.256c0-5.136-4.152-9.312-9.288-9.312-2.04 0-3.936.672-5.496 1.8l.36.336a8.803 8.803 0 015.136-1.656c4.872 0 8.808 3.96 8.808 8.832a8.79 8.79 0 01-1.416 4.776H4.62c-.888-1.368-1.44-3.024-1.44-4.776 0-1.92.624-3.696 1.656-5.136l-.336-.36a9.355 9.355 0 00-1.8 5.496c0 1.944.648 3.792 1.656 5.256zm.888-11.688l6.6 6.6a.218.218 0 00.168.072c.144 0 .24-.096.24-.24a.218.218 0 00-.072-.168l-6.6-6.6-.336.336z"  /></Svg>;
}

export default TachometerSlowThin;