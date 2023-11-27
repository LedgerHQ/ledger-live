
      // @ts-nocheck

      import * as React from "react";
import Svg, { G, Mask, Rect, Path, Defs, LinearGradient, Stop } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: filter */
type Props = {
  size: number;
};
function jpFlag({
  size
}: Props) {
  return <Svg width={size / 30 * 38} height={size} viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg"><G filter="url(#filter0_d)"><Mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x={3} y={1} width={32} height={24}><Rect x={3} y={1} width={32} height={24} fill="white" /></Mask><G mask="url(#mask0)"><Path fillRule="evenodd" clipRule="evenodd" d="M3 1V25H35V1H3Z" fill="#F7FCFF" /><Mask id="mask1" mask-type="alpha" maskUnits="userSpaceOnUse" x={3} y={1} width={32} height={24}><Path fillRule="evenodd" clipRule="evenodd" d="M3 1V25H35V1H3Z" fill="white" /></Mask><G mask="url(#mask1)"><Path fillRule="evenodd" clipRule="evenodd" d="M19 20.5C23.1421 20.5 26.5 17.1421 26.5 13C26.5 8.85786 23.1421 5.5 19 5.5C14.8579 5.5 11.5 8.85786 11.5 13C11.5 17.1421 14.8579 20.5 19 20.5Z" fill="#E31D1C" /></G></G><Rect x={3} y={1} width={32} height={24} fill="url(#paint0_linear)" style={{
        mixBlendMode: "overlay"
      }} /><Path d="M5 2H33V0H5V2ZM34 3V23H36V3H34ZM33 24H5V26H33V24ZM4 23V3H2V23H4ZM5 24C4.44772 24 4 23.5523 4 23H2C2 24.6569 3.34315 26 5 26V24ZM34 23C34 23.5523 33.5523 24 33 24V26C34.6569 26 36 24.6569 36 23H34ZM33 2C33.5523 2 34 2.44772 34 3H36C36 1.34315 34.6569 0 33 0V2ZM5 0C3.34315 0 2 1.34314 2 3H4C4 2.44772 4.44771 2 5 2V0Z" fill="black" fillOpacity={0.1} style={{
        mixBlendMode: "multiply"
      }} /></G><Defs><LinearGradient id="paint0_linear" x1={19} y1={1} x2={19} y2={25} gradientUnits="userSpaceOnUse"><Stop stopColor="white" stopOpacity={0.7} /><Stop offset={1} stopOpacity={0.3} /></LinearGradient></Defs></Svg>;
}
export default jpFlag;