import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LinkNoneRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.848 20.952l1.104-1.104-16.8-16.8-1.104 1.104 16.8 16.8zm-15.96-.84c1.824 1.872 4.848 1.872 6.72 0l2.88-2.856-1.176-1.176-2.88 2.88c-1.536 1.512-2.856 1.512-4.392 0-1.512-1.536-1.512-2.856 0-4.392l2.88-2.88-1.176-1.176-2.856 2.904c-1.872 1.848-1.872 4.872 0 6.696zm6.624-13.368l1.176 1.176 2.88-2.88c1.536-1.512 2.856-1.512 4.392 0 1.512 1.536 1.512 2.856 0 4.392l-2.88 2.88 1.176 1.176 2.856-2.88c1.872-1.872 1.872-4.896 0-6.72-1.824-1.872-4.848-1.872-6.696 0l-2.904 2.856z"  /></Svg>;
}

export default LinkNoneRegular;