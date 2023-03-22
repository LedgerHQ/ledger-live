import React from "react";
import Svg, {
  Path,
  Rect,
  G,
  Defs,
  Stop,
  ClipPath,
  LinearGradient,
} from "react-native-svg";

// a little bit of hack on the size but that's okay since this illustration is only temporary
const Stax = ({
  size = 90,
  theme,
}: {
  size?: number;
  theme: "light" | "dark";
}) =>
  theme === "light" ? (
    <Svg width={size * 0.611} height={size} viewBox="0 0 55 90" fill="none">
      <Path
        d="M49.9275 89.0531H0.0131235L0 0.94874H49.9275C50.5584 0.947507 51.1833 1.0707 51.7665 1.31128C52.3497 1.55186 52.8798 1.90509 53.3263 2.35076C53.7729 2.79643 54.1271 3.32578 54.3688 3.90853C54.6105 4.49128 54.735 5.11597 54.735 5.74686V84.2493C54.7357 84.8807 54.6118 85.506 54.3705 86.0894C54.1291 86.6728 53.7749 87.2028 53.3283 87.6491C52.8817 88.0953 52.3514 88.4491 51.7678 88.69C51.1842 88.9309 50.5588 89.0543 49.9275 89.0531Z"
        fill="url(#paint0_linear_4868_98503)"
      />
      <Path
        d="M0.00927734 86.803V3.19678H50.2349C50.9107 3.19727 51.5587 3.46583 52.0368 3.94354C52.5148 4.42124 52.7839 5.06908 52.7849 5.7449V84.2492C52.7849 84.9257 52.5163 85.5745 52.0381 86.053C51.5599 86.5315 50.9113 86.8006 50.2349 86.8011L0.00927734 86.803Z"
        fill="url(#paint1_linear_4868_98503)"
      />
      <G clipPath="url(#clip0_4868_98503)">
        <Path
          d="M18.1775 48.4578V53.001H25.0909V51.9934H19.1848V48.4578H18.1775ZM35.55 48.4578V51.9934H29.6439V53.0007H36.5574V48.4578H35.55ZM25.101 41.5441V48.4576H29.6439V47.549H26.1083V41.5441H25.101ZM18.1775 37.001V41.5441H19.1848V38.0083H25.0909V37.001H18.1775ZM29.6439 37.001V38.0083H35.55V41.5441H36.5574V37.001H29.6439Z"
          fill="#D5D5D5"
        />
      </G>
      <Defs>
        <LinearGradient
          id="paint0_linear_4868_98503"
          x1="0"
          y1="45"
          x2="54.7256"
          y2="45"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stop-color="#626060" />
          <Stop offset="0.18" stopColor="#888887" />
          <Stop offset="0.4" stopColor="#5E5D5E" />
          <Stop offset="0.59" stopColor="#616161" />
          <Stop offset="0.76" stopColor="#6C6B6C" />
          <Stop offset="0.86" stopColor="#767676" />
          <Stop offset="0.99" stopColor="#8D8D8D" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_4868_98503"
          x1="52.1905"
          y1="44.9999"
          x2="0.64865"
          y2="44.9999"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.92" stopColor="#FFFFFE" />
          <Stop offset="1" stopColor="#DADADA" />
        </LinearGradient>
        <ClipPath id="clip0_4868_98503">
          <Rect
            width="18.3799"
            height="16"
            fill="white"
            transform="translate(18.1775 37.001)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  ) : (
    <Svg width={size * 0.611} height={size} viewBox="0 0 55 90" fill="none">
      <Path
        d="M49.9275 89.0526H0.0131235L0 0.948251H49.9275C50.5584 0.947019 51.1833 1.07022 51.7665 1.31079C52.3498 1.55137 52.8798 1.9046 53.3263 2.35027C53.7729 2.79594 54.1272 3.3253 54.3689 3.90804C54.6106 4.49079 54.735 5.11549 54.735 5.74638V84.2489C54.7357 84.8802 54.6119 85.5055 54.3705 86.0889C54.1291 86.6723 53.775 87.2023 53.3283 87.6486C52.8817 88.0949 52.3514 88.4486 51.7678 88.6895C51.1843 88.9305 50.5589 89.0539 49.9275 89.0526Z"
        fill="url(#paint0_linear_4869_98513)"
      />
      <Path
        d="M0.00952148 86.8028V3.19653H50.2351C50.911 3.19703 51.559 3.46559 52.0371 3.94329C52.5151 4.421 52.7842 5.06883 52.7851 5.74466V84.249C52.7851 84.9255 52.5165 85.5743 52.0384 86.0528C51.5602 86.5313 50.9116 86.8004 50.2351 86.8009L0.00952148 86.8028Z"
        fill="url(#paint1_linear_4869_98513)"
      />
      <G clipPath="url(#clip0_4869_98513)">
        <Path
          d="M18.1777 48.4573V53.0005H25.0912V51.9929H19.185V48.4573H18.1777ZM35.5503 48.4573V51.9929H29.6441V53.0003H36.5576V48.4573H35.5503ZM25.1012 41.5436V48.4571H29.6441V47.5485H26.1085V41.5436H25.1012ZM18.1777 37.0005V41.5436H19.185V38.0078H25.0912V37.0005H18.1777ZM29.6441 37.0005V38.0078H35.5503V41.5436H36.5576V37.0005H29.6441Z"
          fill="#565656"
        />
      </G>
      <Defs>
        <LinearGradient
          id="paint0_linear_4869_98513"
          x1="0"
          y1="44.9995"
          x2="54.7256"
          y2="44.9995"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#626060" />
          <Stop offset="0.18" stopColor="#888887" />
          <Stop offset="0.4" stopColor="#5E5D5E" />
          <Stop offset="0.59" stopColor="#616161" />
          <Stop offset="0.76" stopColor="#6C6B6C" />
          <Stop offset="0.86" stopColor="#767676" />
          <Stop offset="0.99" stopColor="#8D8D8D" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_4869_98513"
          x1="52.1908"
          y1="44.9997"
          x2="0.648894"
          y2="44.9997"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.92" stopColor="#19191A" />
          <Stop offset="1" stopColor="#353536" />
        </LinearGradient>
        <ClipPath id="clip0_4869_98513">
          <Rect
            width="18.3799"
            height="16"
            fill="white"
            transform="translate(18.1777 37.0005)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  );

export default Stax;
