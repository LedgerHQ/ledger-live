import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LinkNoneUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.112 20.688l.576-.576-16.8-16.8-.576.576 16.8 16.8zm-15.96-.84c1.632 1.632 4.32 1.632 5.976 0l3.288-3.288-.6-.6-3.312 3.264c-1.416 1.416-3.336 1.416-4.728 0-1.416-1.392-1.416-3.312 0-4.728l3.264-3.312-.6-.6-3.288 3.288c-1.632 1.656-1.632 4.344 0 5.976zM10.584 7.44l.6.6 3.312-3.264c1.416-1.416 3.336-1.416 4.728 0 1.416 1.392 1.416 3.312 0 4.728l-3.264 3.312.6.6 3.288-3.288c1.632-1.656 1.632-4.344 0-5.976-1.632-1.632-4.32-1.632-5.976 0L10.584 7.44z"  /></Svg>;
}

export default LinkNoneUltraLight;