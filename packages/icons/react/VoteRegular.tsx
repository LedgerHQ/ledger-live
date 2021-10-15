import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function VoteRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.14 21.36h15.72V2.64H9.492L4.14 7.992V21.36zm1.56-1.464V8.688h4.584V4.104H18.3v15.792H5.7zm2.184-7.776l3.288 3.312 5.616-5.64-1.104-1.08-4.512 4.488-2.208-2.184-1.08 1.104z"  /></Svg>;
}

export default VoteRegular;