import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CoffeeRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.88 16.02h2.952c1.608 0 3-.6 3.984-1.896.12-.168.24-.312.336-.48h.84c2.832 0 4.944-1.872 4.944-4.488 0-2.664-2.112-4.536-4.944-4.536H3.816v5.52c0 1.824.336 3.024 1.104 3.984 1.008 1.296 2.352 1.896 3.96 1.896zm-6.816 1.8c.072.864.84 1.56 1.752 1.56h14.16c.936 0 1.68-.696 1.752-1.56H2.064zm3.408-6.696v-5.04h9.768v5.04c0 2.28-.912 3.336-3.24 3.336H8.736c-2.304 0-3.264-1.032-3.264-3.336zm11.232 1.056c.144-.576.192-1.248.192-2.04V6.084c2.448 0 3.384.72 3.384 2.64v.84c0 1.848-.888 2.616-3.192 2.616h-.384z"  /></Svg>;
}

export default CoffeeRegular;