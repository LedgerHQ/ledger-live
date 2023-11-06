import React, { ComponentProps } from "react";
import Svg, { Circle, G, Path } from "react-native-svg";

const NoLocationImage = (props: ComponentProps<typeof Svg>) => {
  return (
    <Svg width={113} height={114} {...props}>
      <G fill="none" fillRule="evenodd">
        <Path
          fill="#EFF3FD"
          fillRule="nonzero"
          d="M73.94 11.043A22.503 22.503 0 0 0 73 17.5C73 29.926 83.074 40 95.5 40c2.43 0 4.77-.385 6.962-1.098A53.315 53.315 0 0 1 107 60.5c0 29.547-23.953 53.5-53.5 53.5S0 90.047 0 60.5 23.953 7 53.5 7a53.34 53.34 0 0 1 20.44 4.043z"
        />
        <Path
          stroke="#bdb3ff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M54 89.905C41.333 74.593 35 61.247 35 49.867 35 39.447 43.507 31 54 31s19 8.447 19 18.867c0 11.38-6.333 24.726-19 40.038zM54.5 58a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"
        />
        <Circle cx={95.5} cy={17.5} r={17.5} fill="#EA2E49" fillRule="nonzero" />
        <Path
          fill="#FFF"
          d="M96.471 20.498h-.896a1 1 0 0 1-.999-.944l-.472-8.499A1 1 0 0 1 95.103 10h1.84a1 1 0 0 1 .998 1.055l-.471 8.499a1 1 0 0 1-.999.944zM94 24.173c0-.601.171-1.056.514-1.364.343-.308.842-.462 1.497-.462.633 0 1.122.157 1.469.472.347.316.52.767.52 1.354 0 .566-.175 1.012-.526 1.338-.35.326-.838.489-1.463.489-.64 0-1.135-.16-1.485-.478-.35-.319-.526-.768-.526-1.349z"
        />
      </G>
    </Svg>
  );
};

export default NoLocationImage;
