import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function GooglePlayRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.392 21.288L13.728 12 4.392 2.712C3.864 3 3.6 3.408 3.6 3.984V20.04c0 .576.264.984.792 1.248zm2.16-.432l10.08-5.832-2.16-2.208-7.92 8.04zm0-17.688l7.92 8.04 2.16-2.16-10.08-5.88zM15.312 12l2.352 2.352 2.136-1.224c.384-.216.6-.672.6-1.104 0-.432-.216-.888-.6-1.08l-2.136-1.248L15.312 12z"  /></Svg>;
}

export default GooglePlayRegular;