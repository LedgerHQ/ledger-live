import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ComputerRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.232 20.4h13.56a1.786 1.786 0 00-1.752-1.392h-2.16l-.552-2.688h5.232c.984 0 1.8-.816 1.8-1.8V5.4c0-.984-.816-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8v9.12c0 .984.816 1.8 1.8 1.8h5.232l-.552 2.688H6.96c-.84 0-1.56.624-1.728 1.392zM4.2 14.472V5.424c0-.216.144-.36.36-.36h14.88c.216 0 .36.144.36.36v9.048c0 .216-.144.384-.36.384H4.56c-.216 0-.36-.168-.36-.384zm6.24 4.536l.576-2.688h1.968l.576 2.688h-3.12z"  /></Svg>;
}

export default ComputerRegular;