import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#f4b731";
function DAI({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M6.583 6h4.914c2.989 0 5.254 1.587 6.097 3.896h1.531v1.395h-1.208q.035.331.035.674v.034q0 .386-.045.758h1.218v1.395h-1.56C16.7 16.429 14.452 18 11.497 18H6.584v-3.848H4.875v-1.395h1.708V11.29H4.875V9.896h1.708zm1.373 8.152v2.596h3.54c2.185 0 3.809-1.04 4.564-2.596zm8.525-1.395H7.955V11.29h8.528q.046.346.047.708v.034a5 5 0 01-.05.723m-4.984-5.508c2.195 0 3.823 1.068 4.574 2.646H7.956V7.25z" clipRule="evenodd" /></Svg>;
}
DAI.DefaultColor = DefaultColor;
export default DAI;