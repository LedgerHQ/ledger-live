import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DevicesAltRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.572 19.92h7.344v-1.392H9.78l.576-2.688h1.56v-1.464H3.9c-.216 0-.36-.168-.36-.384V4.944c0-.216.144-.36.36-.36h14.88c.216 0 .36.144.36.36V6.12h1.56v-1.2c0-.984-.816-1.8-1.8-1.8H3.78c-.984 0-1.8.816-1.8 1.8v9.12c0 .984.816 1.8 1.8 1.8h5.232l-.552 2.688H6.3c-.84 0-1.56.624-1.728 1.392zm8.928-.84c0 .984.816 1.8 1.8 1.8h4.92c.984 0 1.8-.816 1.8-1.8V9.6c0-.984-.816-1.8-1.8-1.8H15.3c-.984 0-1.8.816-1.8 1.8v9.48zm1.464.048V9.552a.38.38 0 01.384-.384h4.848c.216 0 .36.168.36.384v9.576c0 .216-.144.36-.36.36h-4.848c-.216 0-.384-.144-.384-.36zm2.016-1.224c0 .432.336.792.792.792.432 0 .768-.36.768-.792a.758.758 0 00-.768-.768c-.456 0-.792.336-.792.768z"  /></Svg>;
}

export default DevicesAltRegular;