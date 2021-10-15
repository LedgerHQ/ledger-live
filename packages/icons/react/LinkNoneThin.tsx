import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LinkNoneThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.232 20.568l.336-.336-16.8-16.8-.336.336 16.8 16.8zm-15.936-.864c1.536 1.536 4.032 1.536 5.592 0l3.504-3.48-.336-.336-3.504 3.48c-1.368 1.344-3.576 1.344-4.92 0-1.344-1.344-1.344-3.552 0-4.92l3.48-3.504-.336-.336-3.48 3.504c-1.536 1.56-1.536 4.056 0 5.592zm6.312-11.928l.336.336 3.504-3.48c1.368-1.344 3.576-1.344 4.92 0 1.344 1.344 1.344 3.552 0 4.92l-3.48 3.504.336.336 3.48-3.504c1.536-1.56 1.536-4.056 0-5.592-1.536-1.536-4.032-1.536-5.592 0l-3.504 3.48z"  /></Svg>;
}

export default LinkNoneThin;