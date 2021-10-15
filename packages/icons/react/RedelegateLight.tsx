import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RedelegateLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 8.184V12h1.152V8.184c0-.744.744-1.512 1.512-1.512H20.28a97.129 97.129 0 00-1.584 1.536l-1.464 1.488.744.744 4.344-4.344-4.344-4.344-.744.768 1.464 1.464a94.88 94.88 0 001.56 1.536H5.304c-1.32 0-2.664 1.392-2.664 2.664zm-.96 9.72l4.344 4.344.768-.768-1.464-1.464a97.129 97.129 0 00-1.584-1.536h14.952c1.344 0 2.664-1.392 2.664-2.664V12h-1.152v3.816c0 .72-.744 1.512-1.512 1.512H3.72c.552-.528 1.08-1.032 1.608-1.56l1.464-1.464-.768-.768-4.344 4.368z"  /></Svg>;
}

export default RedelegateLight;