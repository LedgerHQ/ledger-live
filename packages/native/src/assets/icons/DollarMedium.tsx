import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function DollarMedium({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.688 14.496c.072 3.24 2.16 5.448 5.376 5.832v1.992h2.04v-1.968c3-.36 5.208-2.304 5.208-5.064 0-2.64-1.872-4.008-4.728-4.392l-2.376-.336c-1.824-.264-2.664-.816-2.664-2.16v-.336c0-1.584.96-2.328 3.096-2.328h.672c2.4 0 3.192.936 3.216 3.264H18c-.048-2.856-2.016-4.944-4.896-5.328V1.68h-2.04v1.992c-2.784.36-4.848 2.16-4.848 4.728 0 2.448 1.704 3.864 4.44 4.248l2.256.288c2.112.288 3 .888 3 2.376v.456c0 1.728-1.08 2.496-3.48 2.496h-.576c-2.856 0-3.696-1.176-3.696-3.768H5.688z"
        fill={color}
      />
    </Svg>
  );
}

export default DollarMedium;
