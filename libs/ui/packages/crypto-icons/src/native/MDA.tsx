import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#01A64F";

function MDA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M15.497 5.994c.912.975 1.378 2.199 1.378 3.63 0 1.453-.466 2.678-1.379 3.652a4.528 4.528 0 01-2.614 1.39v.85h2.067v.935h-2.088v.497h2.088v.871h-2.067V19.5h-1.764v-1.68H9.07v-.872h2.068v-.497H9.071v-.934h2.048v-.872a4.533 4.533 0 01-2.595-1.39c-.932-.975-1.399-2.2-1.399-3.651 0-1.473.446-2.697 1.379-3.652.931-.975 2.088-1.452 3.507-1.452 1.398 0 2.553.477 3.486 1.494zm-1.905 5.54c.384-.498.588-1.142.588-1.93 0-.768-.203-1.41-.629-1.909-.405-.518-.932-.767-1.54-.767-.629 0-1.155.249-1.561.747-.407.498-.61 1.12-.61 1.909 0 .808.204 1.452.61 1.95.405.497.932.746 1.56.746.65 0 1.196-.248 1.582-.746z"  /></Svg>;
}

MDA.DefaultColor = DefaultColor;
export default MDA;