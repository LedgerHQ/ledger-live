import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoSAltThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 9.408L13.392 19.8v2.04h7.128v-9.6H21V9.672h-.48V6.84H21V4.32h-.48V2.16h-6.96v7.608L8.088 4.296 3 9.408zm.672 0l4.416-4.44 11.04 11.04c.624.624.912 1.368.912 2.232 0 1.704-1.44 3.12-3.12 3.12a3.126 3.126 0 01-2.232-.936L3.672 9.408zm11.448 8.808c0 .984.792 1.824 1.824 1.824.984 0 1.752-.84 1.752-1.824 0-.984-.792-1.776-1.752-1.776-1.032 0-1.824.792-1.824 1.776zm.48 0c0-.72.576-1.296 1.344-1.296.696 0 1.272.576 1.272 1.296 0 .72-.576 1.344-1.272 1.344a1.342 1.342 0 01-1.344-1.344z"  /></Svg>;
}

export default NanoSAltThin;