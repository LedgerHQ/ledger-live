import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SixCircledFinaRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.56 16.704c1.92 0 3.24-1.32 3.24-3.096s-1.344-3.072-3-3.072c-.864 0-1.656.384-2.064 1.056H8.52c0-1.8.528-2.88 2.088-2.88.984 0 1.608.408 1.728 1.272h1.44c-.24-1.608-1.44-2.64-3.168-2.64-2.304 0-3.624 1.872-3.6 4.8.024 2.856 1.32 4.56 3.552 4.56zM4.152 21.24h6.456c5.184 0 9.24-4.224 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24H4.152v1.56h6.456c4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68H4.152v1.56zm4.608-7.368v-.6c0-.936.552-1.44 1.68-1.44h.192c1.128 0 1.656.504 1.656 1.44v.6c0 .936-.528 1.44-1.656 1.44h-.192c-1.152 0-1.68-.528-1.68-1.44z"  /></Svg>;
}

export default SixCircledFinaRegular;