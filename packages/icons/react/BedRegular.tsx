import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BedRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.256 18.78h1.488v-3.12H20.28l-.024 3.12h1.488v-6.936c0-2.016-1.536-3.552-3.552-3.552l-6.336.024V14.1H3.744V5.22H2.256v13.56zm2.568-8.712a2.975 2.975 0 105.952 0c0-1.632-1.344-2.952-2.976-2.952s-2.976 1.32-2.976 2.952zm1.296 0c0-.912.744-1.68 1.68-1.68.936 0 1.68.768 1.68 1.68a1.67 1.67 0 01-1.68 1.68 1.67 1.67 0 01-1.68-1.68zm7.2 4.032V9.78l5.304-.024c1.08 0 1.656.576 1.656 1.656V14.1h-6.96z"  /></Svg>;
}

export default BedRegular;