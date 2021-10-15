import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerMediumThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.332 19.308h15.312c1.008-1.464 1.656-3.312 1.656-5.256 0-4.656-3.408-8.496-7.872-9.192v.48c4.2.696 7.392 4.344 7.392 8.712 0 1.752-.552 3.408-1.44 4.776H4.596a8.79 8.79 0 01-1.416-4.776c0-4.368 3.192-8.016 7.368-8.712v-.48a9.302 9.302 0 00-6.216 14.448zm7.416-5.256c0 .144.096.24.24.24s.24-.096.24-.24v-9.36h-.48v9.36z"  /></Svg>;
}

export default TachometerMediumThin;