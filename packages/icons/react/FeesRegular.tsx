import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FeesRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.392 12.72h6v-1.464h-6v1.464zM3.648 12c0 5.448 2.856 10.2 6.864 10.2h3.048c3.912 0 6.792-4.704 6.792-10.2 0-5.496-2.88-10.2-6.792-10.2h-3.048C6.504 1.8 3.648 6.552 3.648 12zm1.56 0c0-4.776 2.376-8.64 5.304-8.64 2.88 0 5.28 3.864 5.28 8.64 0 4.752-2.4 8.64-5.28 8.64-2.928 0-5.304-3.888-5.304-8.64zm8.592 8.64c1.992-1.728 3.288-4.992 3.288-8.64 0-3.648-1.296-6.912-3.288-8.64 2.736.216 4.992 3.984 4.992 8.64 0 4.632-2.256 8.424-4.992 8.64z"  /></Svg>;
}

export default FeesRegular;