import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#346FCE";

function ATM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M15.193 14.206l.717 1.348a3.277 3.277 0 01-1.355 4.431l-.093.05a3.277 3.277 0 01-4.432-1.355l-2.417-4.546a3.277 3.277 0 011.194-4.34L8.09 8.445a3.277 3.277 0 011.355-4.431l.093-.05A3.277 3.277 0 0113.97 5.32l2.418 4.546a3.277 3.277 0 01-1.194 4.34zm0 0l-1.7-3.198A3.277 3.277 0 009.06 9.653l-.093.049c-.054.03-.108.06-.16.091l1.7 3.2a3.277 3.277 0 004.431 1.354l.093-.05.161-.09z"  /></Svg>;
}

ATM.DefaultColor = DefaultColor;
export default ATM;