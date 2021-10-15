import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function VoteLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.2 21.36h15.6V2.64H9.552L4.2 7.992V21.36zm1.2-1.152V8.688h4.92v-4.92h8.28v16.44H5.4zm2.544-8.16l3.24 3.264 5.568-5.568-.84-.84-4.728 4.704-2.4-2.4-.84.84z"  /></Svg>;
}

export default VoteLight;