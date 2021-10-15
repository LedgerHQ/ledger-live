import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SortRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.312 6.984L7.944 2.64 3.6 6.984l.984.96 1.272-1.248c.432-.456.912-.936 1.344-1.416V20.4h1.488V5.232c.456.504.912.984 1.368 1.464l1.296 1.248.96-.96zm-.624 10.032l4.368 4.344 4.344-4.344-.984-.96-1.248 1.248c-.456.456-.912.936-1.368 1.416V3.6h-1.488v15.144c-.456-.48-.912-.984-1.368-1.44l-1.272-1.248-.984.96z"  /></Svg>;
}

export default SortRegular;