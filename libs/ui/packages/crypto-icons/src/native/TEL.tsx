import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#14C8FF";

function TEL({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M18.81 8.609c.475.384.774 1.18.669 1.764l-1.02 5.643c-.107.588-.669 1.236-1.248 1.439l-5.564 1.954c-.58.203-1.44.056-1.914-.329l-4.544-3.688c-.474-.384-.774-1.176-.667-1.764l1.02-5.643c.106-.588.668-1.235 1.248-1.439l5.565-1.954c.58-.204 1.44-.056 1.915.328l4.54 3.689zm-4.733 2.533l.226-1.147-2.124.003.3-1.512h-.686a4.319 4.319 0 01-2.061 1.67l-.193.988h.929s-.315 1.42-.42 1.945c-.263 1.335.397 2.282 1.411 2.282h1.716l.3-1.268H12.04c-.638 0-.604-.349-.48-.967l.395-1.997 2.122.003z"  /></Svg>;
}

TEL.DefaultColor = DefaultColor;
export default TEL;