import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.488 19.56v1.8h15.024v-1.8c-.024-1.776-.336-2.952-1.08-3.864-.984-1.296-2.616-2.016-4.464-2.016h-3.936c-1.848 0-3.432.72-4.44 2.016-.744.936-1.08 2.112-1.104 3.864zm2.04 0v-1.2c0-1.968.744-2.64 2.832-2.64h5.304c2.064 0 2.808.672 2.808 2.64v1.2H6.528zm.624-12.192c0 2.664 2.184 4.728 4.848 4.728 2.664 0 4.848-2.064 4.848-4.728 0-2.664-2.184-4.728-4.848-4.728-2.664 0-4.848 2.064-4.848 4.728zm1.92 0A2.91 2.91 0 0112 4.44a2.91 2.91 0 012.928 2.928A2.91 2.91 0 0112 10.296a2.91 2.91 0 01-2.928-2.928z"  /></Svg>;
}

export default UserMedium;