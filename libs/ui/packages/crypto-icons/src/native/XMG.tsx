import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function XMG({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M17.25 14.655l-1.112 4.095H6.75v-.685l5.092-5.789-4.99-6.282V5.25h9.249l.323 3.189h-.593q-.585-1.09-.996-1.631-.41-.54-.731-.675a2 2 0 00-.626-.157 8 8 0 00-.954-.049H9.896l3.937 4.905v.236l-4.866 5.524h5.554q.41 0 .75-.195.34-.196.588-.49.263-.306.462-.655.213-.37.373-.767z" clipRule="evenodd" /><Path  fillRule="evenodd" d="M17.25 14.655l-1.112 4.095H6.75v-.685l5.092-5.789-4.99-6.282V5.25h9.249l.323 3.189h-.593q-.585-1.09-.996-1.631-.41-.54-.731-.675a2 2 0 00-.626-.157 8 8 0 00-.954-.049H9.896l3.937 4.905v.236l-4.866 5.524h5.554q.41 0 .75-.195.34-.196.588-.49.263-.306.462-.655.213-.37.373-.767z" clipRule="evenodd" /></Svg>;
}
XMG.DefaultColor = DefaultColor;
export default XMG;