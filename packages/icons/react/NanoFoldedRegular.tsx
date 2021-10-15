import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoFoldedRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.98 21.252h16.032c2.184 0 4.008-1.824 4.008-4.032 0-1.056-.432-2.04-1.152-2.784L9.204 2.748 3.636 8.292l4.968 4.944H1.98v8.016zm1.464-1.464V14.7h14.568a2.52 2.52 0 012.52 2.52c0 1.416-1.128 2.568-2.52 2.568H3.444zm2.28-11.496l3.48-3.48 8.4 8.448c-.24-.024-.504-.024-.768-.024h-6.144L5.724 8.292zm10.752 8.928c0 .744.624 1.416 1.416 1.416.768 0 1.368-.672 1.368-1.416 0-.768-.6-1.368-1.368-1.368-.792 0-1.416.6-1.416 1.368z"  /></Svg>;
}

export default NanoFoldedRegular;