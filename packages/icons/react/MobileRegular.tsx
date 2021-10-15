import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MobileRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.9 22.32h10.2c.984 0 1.8-.816 1.8-1.8V3.48c0-.984-.816-1.8-1.8-1.8H6.9c-.984 0-1.8.816-1.8 1.8v17.04c0 .984.816 1.8 1.8 1.8zm-.24-1.824V3.504c0-.216.144-.36.36-.36h9.936c.216 0 .384.144.384.36v16.992c0 .216-.168.36-.384.36H7.02c-.216 0-.36-.144-.36-.36zm4.056-2.184a1.28 1.28 0 001.272 1.272c.696 0 1.248-.6 1.248-1.272a1.24 1.24 0 00-1.248-1.248c-.72 0-1.272.552-1.272 1.248z"  /></Svg>;
}

export default MobileRegular;