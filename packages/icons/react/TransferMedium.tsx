import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TransferMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.016 12.312l4.344-4.368L17.016 3.6 15.84 4.8l1.056 1.056c.384.384.816.792 1.248 1.176H3.6v1.824h14.592c-.456.408-.888.792-1.296 1.2l-1.056 1.08 1.176 1.176zM2.64 16.056L6.984 20.4l1.176-1.2-1.056-1.056a29.775 29.775 0 00-1.248-1.176H20.4v-1.824H5.808c.456-.408.888-.792 1.296-1.2l1.056-1.08-1.176-1.176-4.344 4.368z"  /></Svg>;
}

export default TransferMedium;