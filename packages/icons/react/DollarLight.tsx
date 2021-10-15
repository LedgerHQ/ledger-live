import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DollarLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.952 14.496c.072 3.408 2.232 5.616 5.544 5.88l-.024 1.944h1.272v-1.944c2.928-.216 5.304-2.016 5.304-4.848 0-2.496-1.8-3.84-4.512-4.2l-2.496-.36C9 10.68 7.944 9.864 7.944 8.184v-.192c0-1.944 1.512-3.096 3.96-3.096h.36c2.664 0 3.984 1.44 4.008 4.104h1.488c-.048-3.048-2.064-5.136-5.016-5.376V1.68h-1.248v1.944c-2.64.24-4.944 1.848-4.944 4.56 0 2.352 1.584 3.696 4.176 4.056l2.448.336c2.256.288 3.432 1.176 3.432 2.952v.264c0 2.112-1.608 3.288-4.272 3.288h-.312c-3.096 0-4.584-1.608-4.608-4.584H5.952z"  /></Svg>;
}

export default DollarLight;