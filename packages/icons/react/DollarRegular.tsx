import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DollarRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.82 14.496c.072 3.312 2.208 5.52 5.472 5.856l-.024 1.968h1.656l.024-1.968c2.952-.264 5.232-2.136 5.232-4.944 0-2.568-1.824-3.936-4.608-4.296l-2.448-.336c-1.92-.288-2.856-.984-2.856-2.472V8.04c0-1.776 1.224-2.712 3.504-2.712h.528c2.52 0 3.6 1.176 3.624 3.672h1.968c-.048-2.952-2.016-5.04-4.944-5.352V1.68h-1.656v1.968C8.58 3.936 6.396 5.664 6.396 8.28c0 2.4 1.632 3.792 4.296 4.176l2.352.288c2.184.312 3.216 1.032 3.216 2.688v.336c0 1.944-1.344 2.904-3.864 2.904h-.432c-3 0-4.152-1.392-4.176-4.176H5.82z"  /></Svg>;
}

export default DollarRegular;