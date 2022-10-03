import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#B3BA00";

function NEU({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M9.848 7.998l-.098.06L14.25 15V8.051L12.003 6.75 9.848 7.998zm-.098 7.876l2.352 1.376 2.148-1.254L9.75 9v6.874zM7.5 9.267v5.466L9 15.75v-7.5L7.5 9.267zM15 15.75l1.5-1.04V9.29L15 8.25v7.5z"  /><Path d="M12 3c-4.969 0-9 4.031-9 9s4.031 9 9 9 9-4.031 9-9-4.031-9-9-9zm-.037 14.715l-4.857-2.88V9.084l4.857-2.872 4.857 2.872v5.752l-4.857 2.878v.001z"  /><Path d="M9.848 7.998l-.098.06L14.25 15V8.051L12.003 6.75 9.848 7.998zm-.098 7.876l2.352 1.376 2.148-1.254L9.75 9v6.874zM7.5 9.267v5.466L9 15.75v-7.5L7.5 9.267zM15 15.75l1.5-1.04V9.29L15 8.25v7.5z"  /><Path d="M12 3c-4.969 0-9 4.031-9 9s4.031 9 9 9 9-4.031 9-9-4.031-9-9-9zm-.037 14.715l-4.857-2.88V9.084l4.857-2.872 4.857 2.872v5.752l-4.857 2.878v.001z"  /></Svg>;
}

NEU.DefaultColor = DefaultColor;
export default NEU;