import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DownloadRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.92 21.72h20.16V13.8h-4.8l-1.56 1.56h4.8v4.896H3.48V15.36h4.8L6.72 13.8h-4.8v7.92zm3.144-3.072h1.608v-1.632H5.064v1.632zm2.568-6.792L12 16.2l4.344-4.344-.984-.96-1.248 1.248c-.456.456-.912.936-1.368 1.416V2.28h-1.488v11.304c-.456-.48-.912-.984-1.368-1.44l-1.272-1.248-.984.96z"  /></Svg>;
}

export default DownloadRegular;