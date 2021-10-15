import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LightbulbMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.256 17.544v4.296h7.488v-4.296c0-.888.144-1.176 1.128-2.256l.552-.624c1.392-1.56 2.088-3.216 2.088-5.136 0-4.344-3.528-7.368-7.512-7.368-3.984 0-7.512 3.024-7.512 7.368 0 1.92.696 3.576 2.088 5.136l.552.624c.984 1.08 1.128 1.368 1.128 2.256zM6.408 9.528C6.408 6.216 9.024 3.96 12 3.96c2.976 0 5.592 2.256 5.592 5.568 0 1.488-.528 2.736-1.608 3.936l-.552.624c-1.032 1.176-1.512 1.968-1.584 3.072h-.936v-4.68h-1.8v4.68h-.96c-.072-1.104-.552-1.896-1.584-3.072l-.552-.624c-1.08-1.2-1.608-2.448-1.608-3.936zm3.768 10.512v-1.2h3.648v1.2h-3.648z"  /></Svg>;
}

export default LightbulbMedium;