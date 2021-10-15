import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledMediThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 16.704c2.208 0 3.36-1.848 3.36-4.68s-1.128-4.68-3.36-4.68c-2.208 0-3.36 1.848-3.36 4.68s1.152 4.68 3.36 4.68zM5.76 20.88h12.48v-.48H5.76v.48zm0-17.28h12.48v-.48H5.76v.48zm3.36 8.448V12c0-2.688.936-4.176 2.88-4.176 1.056 0 1.8.432 2.28 1.224l-4.8 5.424c-.24-.648-.36-1.464-.36-2.424zm.576 2.904l4.8-5.424c.264.648.384 1.464.384 2.472v.048c0 2.688-.936 4.176-2.88 4.176-1.056 0-1.824-.432-2.304-1.272z"  /></Svg>;
}

export default ZeroCircledMediThin;