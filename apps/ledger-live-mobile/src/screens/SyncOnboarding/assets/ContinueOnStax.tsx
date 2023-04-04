import React from "react";
import { useTheme } from "styled-components/native";
import { Svg, G, Rect, Path, Defs, ClipPath } from "react-native-svg";

const ContinueOnStax = () => {
  const { theme } = useTheme();
  if (theme === "light") {
    return (
      <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <G clipPath="url(#clip0_3604_160014)">
          <Rect width="48" height="48" rx="24" fill="white" fillOpacity="0.1" />
          <Path
            d="M36.251 19.7854H37.912C38.1539 19.7854 38.3499 19.9814 38.3499 20.2232V25.4638C38.3499 25.7056 38.1539 25.9017 37.912 25.9017H36.251V19.7854Z"
            fill="#999999"
          />
          <Path
            d="M12.5322 14.022H11.6859V14.8684V51.5236V52.37H12.5322H35.8082H36.6546V51.5236V17.1254C36.6546 15.4115 35.2651 14.022 33.5512 14.022H12.5322Z"
            fill="#999999"
            fillOpacity="0.1"
            stroke="#999999"
            strokeWidth="1.69275"
          />
        </G>
        <Rect
          x="0.75"
          y="0.75"
          width="46.5"
          height="46.5"
          rx="23.25"
          stroke="#999999"
          strokeWidth="1.5"
        />
        <Defs>
          <ClipPath id="clip0_3604_160014">
            <Rect width="48" height="48" rx="24" fill="white" />
          </ClipPath>
        </Defs>
      </Svg>
    );
  }
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <G clipPath="url(#clip0_3604_160006)">
        <Rect width="48" height="48" rx="24" fill="white" fillOpacity="0.1" />
        <Path
          d="M36.251 19.7854H37.912C38.1539 19.7854 38.3499 19.9814 38.3499 20.2232V25.4638C38.3499 25.7056 38.1539 25.9017 37.912 25.9017H36.251V19.7854Z"
          fill="#999999"
        />
        <Path
          d="M12.5322 14.022H11.6859V14.8684V51.5236V52.37H12.5322H35.8082H36.6546V51.5236V17.1254C36.6546 15.4115 35.2651 14.022 33.5512 14.022H12.5322Z"
          fill="#999999"
          fillOpacity="0.1"
          stroke="#999999"
          strokeWidth="1.69275"
        />
      </G>
      <Rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="23.25"
        stroke="#999999"
        strokeWidth="1.5"
      />
      <Defs>
        <ClipPath id="clip0_3604_160006">
          <Rect width="48" height="48" rx="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default React.memo(ContinueOnStax);
