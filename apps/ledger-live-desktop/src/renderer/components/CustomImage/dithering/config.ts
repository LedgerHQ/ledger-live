import { Theme } from "@ledgerhq/react-ui";
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

export const mapDitheringConfigKeyToAppearance: (
  theme: Theme,
) => Record<DitheringConfigKey, Appearance> = theme => ({
  [DitheringConfigKey.FourBPPFirst]: {
    type: "two-colors",
    topLeftColor: theme.colors.neutral.c40,
    bottomRightColor: theme.colors.neutral.c30,
  },
  [DitheringConfigKey.FourBPPSecond]: {
    type: "two-colors",
    topLeftColor: theme.colors.neutral.c50,
    bottomRightColor: theme.colors.neutral.c30,
  },
  [DitheringConfigKey.FourBPPThird]: {
    type: "two-colors",
    topLeftColor: theme.colors.neutral.c60,
    bottomRightColor: theme.colors.neutral.c30,
  },
  [DitheringConfigKey.FourBPPFourth]: {
    type: "two-colors",
    topLeftColor: theme.colors.neutral.c70,
    bottomRightColor: theme.colors.neutral.c30,
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
});

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
