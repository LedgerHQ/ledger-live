import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrashMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.84 21.36h10.32c.984 0 1.8-.816 1.8-1.8V9.6h-1.92v9.912a.052.052 0 01-.048.048H7.008a.052.052 0 01-.048-.048V9.6H5.04v9.96c0 .984.816 1.8 1.8 1.8zM3.6 7.992h16.8v-1.8h-4.2V4.176c0-.864-.672-1.536-1.536-1.536H9.336c-.864 0-1.536.672-1.536 1.536v2.016H3.6v1.8zm5.592 9.168h1.8v-6.24h-1.8v6.24zM9.48 6.192V4.368c0-.024.024-.048.048-.048h4.944c.024 0 .048.024.048.048v1.824H9.48zm3.552 10.968h1.8v-6.24h-1.8v6.24z"  /></Svg>;
}

export default TrashMedium;