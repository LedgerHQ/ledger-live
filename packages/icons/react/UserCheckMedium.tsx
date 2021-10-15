import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserCheckMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.084 19.56v1.8h15.024v-3.6l-1.8 1.8H5.124v-1.2c0-1.968.744-2.64 2.832-2.64h2.88l-2.04-2.04h-.408c-1.848 0-3.192.72-4.2 2.016-.744.936-1.104 2.112-1.104 3.864zM5.748 7.368c0 2.664 2.184 4.728 4.848 4.728 2.664 0 4.848-2.064 4.848-4.728 0-2.664-2.184-4.728-4.848-4.728-2.664 0-4.848 2.064-4.848 4.728zm1.92 0a2.91 2.91 0 012.928-2.928 2.91 2.91 0 012.928 2.928 2.91 2.91 0 01-2.928 2.928 2.91 2.91 0 01-2.928-2.928zm4.224 7.008l3.36 3.384 5.664-5.688-1.344-1.344-4.32 4.296-2.016-1.992-1.344 1.344z"  /></Svg>;
}

export default UserCheckMedium;