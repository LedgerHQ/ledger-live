import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RefreshMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 11.88v.96h1.92v-.96c0-4.08 3.288-7.32 7.416-7.32 2.352 0 4.368 1.008 5.736 2.616a25.663 25.663 0 00-1.92-.072H14.28v1.68h6.144V2.64h-1.68v1.512c0 .504.024 1.032.048 1.56a9.014 9.014 0 00-6.816-3.072c-5.184 0-9.336 4.104-9.336 9.24zm.96 9.48h1.68v-1.512c0-.504-.024-1.032-.048-1.56 1.944 2.184 4.464 3.072 6.792 3.072 5.184 0 9.336-4.104 9.336-9.24v-.96h-1.92v.96c0 4.08-3.288 7.32-7.416 7.32-2.328 0-4.344-1.008-5.712-2.616.624.048 1.296.072 1.92.072h1.512v-1.68H3.6v6.144z"  /></Svg>;
}

export default RefreshMedium;