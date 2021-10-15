import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrashRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.02 21.36h9.96c.984 0 1.8-.816 1.8-1.8V9.288h-1.56v10.224a.38.38 0 01-.384.384H7.14c-.216 0-.36-.168-.36-.384V9.288H5.22V19.56c0 .984.816 1.8 1.8 1.8zM3.66 7.656h16.68V6.192h-4.272V4.176c0-.864-.672-1.536-1.536-1.536H9.444c-.864 0-1.536.672-1.536 1.536v2.016H3.66v1.464zM9.3 6.192V4.32c0-.192.096-.312.288-.312h4.8c.192 0 .312.12.312.312v1.872H9.3zm.024 11.088h1.488v-6.672H9.324v6.672zm3.84 0h1.488v-6.672h-1.488v6.672z"  /></Svg>;
}

export default TrashRegular;