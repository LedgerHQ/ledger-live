import { palettes } from "@ledgerhq/react-ui/styles/index";
import { Appearance, DitheringConfig, DitheringConfigKey } from "./types";

import ditheringFloydSteinberg from "../assets/ditheringFloydSteinberg.png";
import ditheringAtkinson from "../assets/ditheringAtkinson.png";
import ditheringAtkinsonReduced from "../assets/ditheringAtkinsonReduced.png";

export const mapDitheringConfigKeyToConfig: Record<DitheringConfigKey, DitheringConfig> = {
  [DitheringConfigKey.FourBPPFirst]: { algorithm: "floyd-steinberg", contrastValue: 1 },
  [DitheringConfigKey.FourBPPSecond]: { algorithm: "floyd-steinberg", contrastValue: 1.5 },
  [DitheringConfigKey.FourBPPThird]: { algorithm: "floyd-steinberg", contrastValue: 2 },
  [DitheringConfigKey.FourBPPFourth]: { algorithm: "floyd-steinberg", contrastValue: 3 },
  [DitheringConfigKey.OneBPPFirst]: { algorithm: "floyd-steinberg", contrastValue: 1 },
  [DitheringConfigKey.OneBPPSecond]: { algorithm: "atkinson", contrastValue: 1 },
  [DitheringConfigKey.OneBPPThird]: { algorithm: "reduced-atkinson", contrastValue: 1 },
};

export const mapDitheringConfigKeyToAppearance: Record<DitheringConfigKey, Appearance> = {
  [DitheringConfigKey.FourBPPFirst]: {
    type: "two-colors",
    topLeftColor: palettes.dark.neutral.c40,
    bottomRightColor: palettes.dark.neutral.c30,
  },
  [DitheringConfigKey.FourBPPSecond]: {
    type: "two-colors",
    topLeftColor: palettes.dark.neutral.c50,
    bottomRightColor: palettes.dark.neutral.c30,
  },
  [DitheringConfigKey.FourBPPThird]: {
    type: "two-colors",
    topLeftColor: palettes.dark.neutral.c60,
    bottomRightColor: palettes.dark.neutral.c30,
  },
  [DitheringConfigKey.FourBPPFourth]: {
    type: "two-colors",
    topLeftColor: palettes.dark.neutral.c70,
    bottomRightColor: palettes.dark.neutral.c30,
  },
  [DitheringConfigKey.OneBPPFirst]: {
    type: "background-picture",
    backgroundPicSrc: ditheringFloydSteinberg,
  },
  [DitheringConfigKey.OneBPPSecond]: {
    type: "background-picture",
    backgroundPicSrc: ditheringAtkinson,
  },
  [DitheringConfigKey.OneBPPThird]: {
    type: "background-picture",
    backgroundPicSrc: ditheringAtkinsonReduced,
  },
};

export const getAvailableDitheringConfigKeys = (bitsPerPixel: 1 | 4): DitheringConfigKey[] => {
  return bitsPerPixel === 1
    ? [
        DitheringConfigKey.OneBPPFirst,
        DitheringConfigKey.OneBPPSecond,
        DitheringConfigKey.OneBPPThird,
      ]
    : [
        DitheringConfigKey.FourBPPFirst,
        DitheringConfigKey.FourBPPSecond,
        DitheringConfigKey.FourBPPThird,
        DitheringConfigKey.FourBPPFourth,
      ];
};
