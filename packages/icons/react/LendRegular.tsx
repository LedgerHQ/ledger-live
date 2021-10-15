import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LendRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.832 13.56v1.464c6.84-.888 12.6-4.464 17.04-9.6-.024.72-.024 1.44-.024 2.136v1.728h1.344V3.12h-6.144v1.368h1.632c.672 0 1.392 0 2.064-.024-4.2 4.872-9.504 8.208-15.912 9.096zm-.024 7.32h1.656v-2.928H2.808v2.928zm4.176 0H8.64v-4.272H6.984v4.272zm4.2 0h1.632v-5.688h-1.632v5.688zm4.176 0h1.656v-7.056H15.36v7.056zm4.152 0h1.656v-8.4h-1.656v8.4z"  /></Svg>;
}

export default LendRegular;