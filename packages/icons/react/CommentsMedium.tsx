import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CommentsMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 4.776v12.528l4.464-3.408H17.52v-9.12c0-.984-.816-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8zm1.92 8.736V4.824c0-.024.024-.048.048-.048h10.944c.024 0 .048.024.048.048v7.272H6.432L4.56 13.512zm3.36 2.304c0 .984.816 1.8 1.8 1.8h7.176l4.464 3.408V8.736c0-1.032-.864-1.92-1.92-1.92v10.416l-1.872-1.416H7.92z"  /></Svg>;
}

export default CommentsMedium;