import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CommentsThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 5.004v12.312l3.816-2.952H17.76v-9.36c0-.984-.816-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8zm.48 11.328V5.004c0-.72.6-1.32 1.32-1.32h11.52c.72 0 1.32.6 1.32 1.32v8.88H6.288L3.12 16.332zm4.32-.288c0 .984.816 1.8 1.8 1.8h8.28l3.84 2.952V8.748c0-.984-.816-1.8-1.8-1.8v.48c.72 0 1.32.6 1.32 1.32v11.064l-3.192-2.448H9.24c-.72 0-1.32-.6-1.32-1.32h-.48z"  /></Svg>;
}

export default CommentsThin;