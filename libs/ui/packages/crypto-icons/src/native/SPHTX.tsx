import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00B098";

function SPHTX({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M4.5 8.918v-.267h6.313v.267H4.5zm0-.776v-.267h6.313v.267H4.5zm2.662 7.98v-6.67h.254v6.67h-.254zm.736 0v-6.67h.252v6.67h-.253zm11.424-.546l-2.849-3.01.178-.188 2.849 3.009-.178.189zm-6.933-7.701l2.849 3.01-.179.188-2.848-3.009.178-.189zm6.413 8.25l-2.849-3.01.179-.189 2.848 3.01-.178.189zM11.87 8.424l2.849 3.009-.18.189-2.848-3.009.18-.189zM15.936 12l.18-.189 3.206-3.387.178.189L16.294 12l-.179.189-.34.36-.18.189-3.205 3.387-.179-.189 3.207-3.387.178-.189.34-.36zm-.34-.738l3.206-3.387.179.189-3.206 3.387-.179.189-.34.36-.18.189-3.205 3.387-.18-.189L14.899 12l.178-.189.342-.36.178-.189z"  /></Svg>;
}

SPHTX.DefaultColor = DefaultColor;
export default SPHTX;