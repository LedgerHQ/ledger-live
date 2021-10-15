import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SixCircledInitLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.212 16.704c1.848 0 3.144-1.32 3.144-3.096s-1.296-3.096-3-3.096c-1.056 0-1.944.552-2.304 1.416h-.168c-.024-2.016.48-3.528 2.352-3.528 1.128 0 1.824.552 1.968 1.608h1.128c-.24-1.632-1.392-2.664-3.072-2.664-2.28 0-3.576 1.872-3.552 4.8.024 2.856 1.32 4.56 3.504 4.56zM4.116 12c0 5.088 4.032 9.12 9.12 9.12h6.648v-1.2h-6.648c-4.44 0-7.92-3.48-7.92-7.92 0-4.32 3.48-7.92 7.92-7.92h6.648v-1.2h-6.648c-5.112 0-9.12 4.152-9.12 9.12zm7.032 1.776v-.408c0-1.128.672-1.824 1.968-1.824h.144c1.248 0 1.944.672 1.944 1.824v.408c0 1.152-.696 1.824-1.944 1.824h-.144c-1.296 0-1.968-.744-1.968-1.824z"  /></Svg>;
}

export default SixCircledInitLight;