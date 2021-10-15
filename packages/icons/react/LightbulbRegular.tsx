import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LightbulbRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.568 17.688v4.032h6.864v-4.032c0-.984.216-1.392 1.248-2.568l.576-.648c1.368-1.512 2.04-3.12 2.04-5.016 0-4.248-3.432-7.176-7.296-7.176-3.864 0-7.296 2.928-7.296 7.176 0 1.896.672 3.504 2.04 5.016l.576.648c1.032 1.176 1.248 1.584 1.248 2.568zM6.264 9.456c0-3.408 2.688-5.712 5.736-5.712 3.048 0 5.736 2.304 5.736 5.712 0 1.536-.552 2.808-1.656 4.056l-.552.624c-1.104 1.248-1.584 2.064-1.656 3.336h-1.128V12.48h-1.488v4.992h-1.128c-.072-1.272-.552-2.088-1.656-3.336l-.552-.624c-1.104-1.248-1.656-2.52-1.656-4.056zm3.864 10.8V18.84h3.744v1.416h-3.744z"  /></Svg>;
}

export default LightbulbRegular;