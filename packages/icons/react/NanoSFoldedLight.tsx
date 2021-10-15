import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoSFoldedLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.04 21.144h16.056c2.112 0 3.864-1.752 3.864-3.888 0-1.104-.432-2.04-1.2-2.832L15.792 9.48l.504-.504-1.776-1.752-.48.504-1.944-1.968.48-.504-1.728-1.728-.504.48-1.152-1.152-5.376 5.352L9 13.392H2.04v7.752zm1.152-1.152V14.52h14.904a2.735 2.735 0 012.736 2.736 2.72 2.72 0 01-2.736 2.736H3.192zM5.424 8.208l3.768-3.744 8.952 8.976a9.3 9.3 0 00-.816-.048h-6.72L5.424 8.208zm11.016 9.048c0 .816.672 1.536 1.536 1.536.84 0 1.512-.72 1.512-1.536 0-.84-.672-1.512-1.512-1.512-.864 0-1.536.672-1.536 1.512z"  /></Svg>;
}

export default NanoSFoldedLight;