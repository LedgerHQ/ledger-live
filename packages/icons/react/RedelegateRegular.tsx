import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RedelegateRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 8.184V12h1.488V8.184c0-.672.648-1.344 1.344-1.344h14.256a81.67 81.67 0 00-1.464 1.368L17.016 9.48l.96.984 4.344-4.368-4.344-4.344-.96.984 1.248 1.248c.456.456.936.912 1.416 1.368H5.472c-1.416 0-2.832 1.464-2.832 2.832zm-.96 9.72l4.344 4.344.96-.984-1.248-1.272c-.456-.432-.936-.912-1.416-1.344h14.208c1.416 0 2.832-1.488 2.832-2.832V12h-1.488v3.816c0 .672-.648 1.344-1.344 1.344H4.296c.48-.456.984-.912 1.44-1.368l1.248-1.296-.96-.96-4.344 4.368z"  /></Svg>;
}

export default RedelegateRegular;