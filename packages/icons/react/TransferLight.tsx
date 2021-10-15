import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TransferLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.016 12.288l4.344-4.344L17.016 3.6l-.744.768 1.464 1.464a94.88 94.88 0 001.56 1.536H3.6V8.52h15.72a97.046 97.046 0 00-1.584 1.536l-1.464 1.488.744.744zM2.64 16.056L6.984 20.4l.768-.768-1.464-1.464a97.129 97.129 0 00-1.584-1.536H20.4V15.48H4.68c.552-.528 1.08-1.032 1.608-1.56l1.464-1.464-.768-.768-4.344 4.368z"  /></Svg>;
}

export default TransferLight;