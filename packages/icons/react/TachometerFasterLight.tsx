import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFasterLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.152 19.836h15.624c.792-.984 1.488-2.424 1.776-3.816h-1.224a8.235 8.235 0 01-1.128 2.616H4.776a8.43 8.43 0 01-1.392-4.656c0-4.752 3.84-8.616 8.592-8.616 4.056 0 7.44 2.808 8.352 6.576h1.224a9.764 9.764 0 00-9.576-7.776c-5.4 0-9.792 4.416-9.792 9.816 0 2.184.744 4.248 1.968 5.856zm7.224-5.856c0 .336.264.6.6.6h9.84v-1.2h-9.84c-.336 0-.6.264-.6.6z"  /></Svg>;
}

export default TachometerFasterLight;