import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";

function ABI({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M12 24c6.627 0 12-5.372 12-12 0-6.627-5.373-12-12-12-4.033 0-7.601 1.99-9.777 5.04h4.44a.96.96 0 010 1.92H1.106C.891 7.425.704 7.905.55 8.4h13.173a.96.96 0 110 1.92H.116A12.098 12.098 0 000 11.915h4.687a.96.96 0 110 1.92H.139c.08.52.193 1.03.337 1.525h13.246a.96.96 0 110 1.92H1.221c.283.578.612 1.13.982 1.651h4.46a.96.96 0 110 1.92H3.897A11.957 11.957 0 0012 24.002zm4.358-6.72a.96.96 0 110-1.92.96.96 0 010 1.92zm-.96-7.92a.96.96 0 101.92 0 .96.96 0 00-1.92 0zm-7.21 10.538a.96.96 0 101.92 0 .96.96 0 00-1.92 0zm.96-12.938a.96.96 0 110-1.92.96.96 0 010 1.92zm.042 5.915c0 .53.43.96.96.96h10.797a.96.96 0 100-1.92H10.15a.96.96 0 00-.96.96zm-1.778.96a.96.96 0 110-1.92.96.96 0 010 1.92z"  /></Svg>;
}

ABI.DefaultColor = DefaultColor;
export default ABI;