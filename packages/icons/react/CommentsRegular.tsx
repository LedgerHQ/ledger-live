import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CommentsRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 4.836v12.48l4.296-3.312h10.656V4.836c0-.984-.84-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8zM4.2 14.22V4.86a.37.37 0 01.36-.36h11.088c.216 0 .384.168.384.36v7.68H6.384L4.2 14.22zm3.6 1.656c0 .984.816 1.8 1.8 1.8h7.464l4.296 3.288V8.748a1.916 1.916 0 00-1.896-1.896v1.56c.192 0 .336.24.336.696v8.784l-2.184-1.68h-7.56c-.552 0-.696-.168-.696-.336H7.8z"  /></Svg>;
}

export default CommentsRegular;