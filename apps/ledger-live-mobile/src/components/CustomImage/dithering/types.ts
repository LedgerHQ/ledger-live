import { ImageSourcePropType } from "react-native";

export type DitheringAlgorithm = "floyd-steinberg" | "atkinson" | "reduced-atkinson";

export type DitheringConfig = {
  algorithm: DitheringAlgorithm;
  contrastValue: number;
};

export enum DitheringConfigKey {
  FourBPPFirst,
  FourBPPSecond,
  FourBPPThird,
  FourBPPFourth,
  OneBPPFirst,
  OneBPPSecond,
  OneBPPThird,
}

/**
 * Image data that can be displayed in LL
 */
export type ProcessorPreviewResult = {
  imageBase64DataUri: string;
  height: number;
  width: number;
};

/**
 * Image data that can be transfered to the device
 */
export type ProcessorRawResult = {
  hexData: string;
  height: number;
  width: number;
};

export type Appearance =
  | {
      type: "two-colors";
      topLeftColor: string;
      bottomRightColor: string;
    }
  | {
      type: "background-picture";
      backgroundPicSrc: ImageSourcePropType;
    };
