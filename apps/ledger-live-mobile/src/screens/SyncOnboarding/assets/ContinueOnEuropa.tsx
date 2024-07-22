import React from "react";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { useTheme } from "styled-components/native";

const ContinueOnEuropa = () => {
  const { theme } = useTheme();

  if (theme === "light") {
    return (
      <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
        <G clipPath="url(#clip0_15082_6009)">
          <Rect width={48} height={48} rx={24} fill="black" fillOpacity={0.1} />
          <Path
            d="M36.251 19.7854H37.912C38.1539 19.7854 38.3499 19.9814 38.3499 20.2232V25.4638C38.3499 25.7056 38.1539 25.9017 37.912 25.9017H36.251V19.7854Z"
            fill="black"
            fillOpacity={0.4}
          />
          <Path
            d="M35.8082 52.37H36.6546V51.5236V17.8684C36.6546 15.7441 34.9325 14.022 32.8082 14.022H15.5322C13.4079 14.022 11.6859 15.7441 11.6859 17.8684V51.5236V52.37H12.5322H35.8082Z"
            fill="black"
            fillOpacity={0.05}
            stroke="#767676"
            strokeWidth={1.69275}
          />
          <Path
            d="M14.0303 43.1301C14.0303 41.882 15.0421 40.8701 16.2903 40.8701H32.0533C33.2998 40.8701 34.3103 41.8806 34.3103 43.1271V53.5301H14.0303V43.1301Z"
            fill="black"
            fillOpacity={0.4}
          />
        </G>
        <Rect
          x={0.75}
          y={0.75}
          width={46.5}
          height={46.5}
          rx={23.25}
          stroke="black"
          strokeOpacity={0.4}
          strokeWidth={1.5}
        />
        <Defs>
          <ClipPath id="clip0_15082_6009">
            <Rect width={48} height={48} rx={24} fill="white" />
          </ClipPath>
        </Defs>
      </Svg>
    );
  }
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <G clipPath="url(#clip0_15009_5922)">
        <Rect width={48} height={48} rx={24} fill="white" fillOpacity={0.1} />
        <Path
          d="M36.251 19.7854H37.912C38.1539 19.7854 38.3499 19.9814 38.3499 20.2232V25.4638C38.3499 25.7056 38.1539 25.9017 37.912 25.9017H36.251V19.7854Z"
          fill="white"
          fillOpacity={0.4}
        />
        <Path
          d="M35.8082 52.37H36.6546V51.5236V17.8684C36.6546 15.7441 34.9325 14.022 32.8082 14.022H15.5322C13.4079 14.022 11.6859 15.7441 11.6859 17.8684V51.5236V52.37H12.5322H35.8082Z"
          fill="white"
          fillOpacity={0.05}
          stroke="#949494"
          strokeWidth={1.69275}
        />
        <Path
          d="M14.0303 43.1301C14.0303 41.882 15.0421 40.8701 16.2903 40.8701H32.0533C33.2998 40.8701 34.3103 41.8806 34.3103 43.1271V53.5301H14.0303V43.1301Z"
          fill="white"
          fillOpacity={0.4}
        />
      </G>
      <Rect
        x={0.75}
        y={0.75}
        width={46.5}
        height={46.5}
        rx={23.25}
        stroke="white"
        strokeOpacity={0.4}
        strokeWidth={1.5}
      />
      <Defs>
        <ClipPath id="clip0_15009_5922">
          <Rect width={48} height={48} rx={24} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default ContinueOnEuropa;
