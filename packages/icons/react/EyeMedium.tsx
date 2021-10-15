import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EyeMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 19.68c3.984 0 8.28-3.288 10.32-7.68C20.28 7.608 15.984 4.32 12 4.32S3.72 7.608 1.68 12c2.04 4.392 6.336 7.68 10.32 7.68zM3.792 12C5.736 8.4 8.904 6.12 12 6.12S18.264 8.4 20.208 12c-1.944 3.6-5.112 5.88-8.208 5.88S5.736 15.6 3.792 12zM8.4 12c0 1.992 1.608 3.6 3.6 3.6s3.6-1.608 3.6-3.6-1.608-3.6-3.6-3.6A3.595 3.595 0 008.4 12zm1.68 0c0-1.056.864-1.92 1.92-1.92s1.92.864 1.92 1.92-.864 1.92-1.92 1.92A1.926 1.926 0 0110.08 12z"  /></Svg>;
}

export default EyeMedium;