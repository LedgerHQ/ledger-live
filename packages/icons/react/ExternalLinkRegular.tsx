import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ExternalLinkRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.76 21.24l16.56-.024V12h-1.56v7.656l-13.44.024V6.24H12V4.68H2.76v16.56zm7.896-8.952l1.056 1.056 8.208-8.208c-.024.696-.048 1.368-.048 2.064v1.728h1.368V2.76h-6.144v1.368h1.728c.648 0 1.344 0 2.016-.024l-8.184 8.184z"  /></Svg>;
}

export default ExternalLinkRegular;