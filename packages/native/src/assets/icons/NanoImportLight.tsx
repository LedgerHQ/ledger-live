import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoImportLight({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.64 9.048h18.72V2.76H2.664L2.64 9.048zm1.08-1.08l.024-4.128h7.176a2.787 2.787 0 00-.888 2.064c0 .816.336 1.56.888 2.064h-7.2zm3.936 8.928L12 21.24l4.344-4.344-.768-.768-1.416 1.44c-.528.504-1.056 1.056-1.584 1.608V10.92h-1.152v8.28a103.324 103.324 0 00-1.584-1.632l-1.44-1.44-.744.768zm3.456-10.992c0-1.128.936-2.064 2.016-2.064h7.152v4.128h-7.152c-1.08 0-2.016-.936-2.016-2.064zm1.008 0c0 .648.528 1.176 1.152 1.176.648 0 1.176-.528 1.176-1.176 0-.648-.528-1.176-1.176-1.176-.624 0-1.152.528-1.152 1.176z"
        fill={color}
      />
    </Svg>
  );
}

export default NanoImportLight;
