import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#EF494D";

function TIX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M4.5 8.54c0-.16.13-.29.29-.29H8.56c1.738 0 2.826.897 2.826 2.164 0 .529-.242 1.01-.725 1.442.676.385 1.014.962 1.014 1.73 0 1.804-1.74 2.164-2.899 2.164H4.79a.29.29 0 01-.29-.29v-.862c0-.16.13-.29.29-.29h3.985c.822 0 1.233-.265 1.233-.794 0-.528-.411-.817-1.233-.865H4.79a.29.29 0 01-.29-.289v-.862c0-.161.13-.29.29-.29h3.985c.58-.097.87-.337.87-.722 0-.528-.29-.793-.87-.793H4.79a.29.29 0 01-.29-.29V8.54zm7.827 0c0-.16.13-.29.29-.29h3.84c.16 0 .29.13.29.29v6.92a.29.29 0 01-.29.29h-1.088a.29.29 0 01-.29-.29V9.982a.29.29 0 00-.289-.29h-2.175a.29.29 0 01-.29-.29l.002-.862zm5.433-.29h1.45c.16 0 .29.13.29.29v.862a.29.29 0 01-.29.29h-1.45a.29.29 0 01-.29-.29V8.54c0-.16.13-.29.29-.29z"  /></Svg>;
}

TIX.DefaultColor = DefaultColor;
export default TIX;