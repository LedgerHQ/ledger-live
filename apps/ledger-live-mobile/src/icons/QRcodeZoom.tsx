import React from "react";
import Svg, { Circle, G, Path } from "react-native-svg";

type Props = {
  size: number;
};

const QRcodeZoom = ({ size }: Props) => {
  return (
    <Svg viewBox="0 0 72 72" width={size || 72} height={size || 72}>
      <G fill="none" fillRule="evenodd">
        <Path
          d="M0 30.857h30.857V0H0v30.857zM6.429 6.43h18v18h-18v-18zM41.143 0v30.857H72V0H41.143zM65.57 24.429h-18v-18h18v18zM0 72h30.857V41.143H0V72zm6.429-24.429h18v18h-18v-18zm5.142 5.143h7.715v7.715H11.57v-7.715zm0-41.143h7.715v7.715H11.57V11.57zm48.858 7.715h-7.715V11.57h7.715v7.715zm6.428 21.857H72v20.571H51.429v-5.143h-5.143V72h-5.143V41.143H56.57v5.143h10.286v-5.143zm0 25.714H72V72h-5.143v-5.143zm-10.286 0h5.143V72h-5.143v-5.143z"
          fill="#D8D8D8"
          fillRule="nonzero"
        />
        <G transform="translate(16 16)">
          <Circle stroke="#D8D8D8" fill="#FFF" cx={20} cy={20} r={19.5} />
          <Path
            d="M16 10a1 1 0 0 1 0 2h-3a1 1 0 0 0-1 1v3a1 1 0 0 1-2 0v-3a3 3 0 0 1 3-3h3zm14 6a1 1 0 0 1-2 0v-3a1 1 0 0 0-1-1h-3a1 1 0 0 1 0-2h3a3 3 0 0 1 3 3v3zm-6 14a1 1 0 0 1 0-2h3a1 1 0 0 0 1-1v-3a1 1 0 0 1 2 0v3a3 3 0 0 1-3 3h-3zm-14-6a1 1 0 0 1 2 0v3a1 1 0 0 0 1 1h3a1 1 0 0 1 0 2h-3a3 3 0 0 1-3-3v-3zm6.2-9h7.6a1.2 1.2 0 0 1 1.2 1.2v7.6a1.2 1.2 0 0 1-1.2 1.2h-7.6a1.2 1.2 0 0 1-1.2-1.2v-7.6a1.2 1.2 0 0 1 1.2-1.2z"
            fill="#bdb3ff"
            fillRule="nonzero"
          />
        </G>
      </G>
    </Svg>
  );
};

export default QRcodeZoom;
