import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BluetoothLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 22.32c5.424 0 7.896-3.192 7.944-10.32C19.896 4.872 17.424 1.68 12 1.68 6.576 1.68 4.104 4.872 4.056 12c.048 7.128 2.52 10.32 7.944 10.32zm-4.464-6.552L11.28 12 7.536 8.232l1.008-1.008 2.976 3.072v-7.2l5.208 5.376L13.2 12l3.528 3.528-5.208 5.376v-7.2l-2.976 3.072-1.008-1.008zm5.4 1.584l1.752-1.824-1.752-1.824v3.648zm0-7.056l1.752-1.824-1.752-1.824v3.648z"  /></Svg>;
}

export default BluetoothLight;