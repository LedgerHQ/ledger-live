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

export type ProcessImageArgs = {
  image: HTMLImageElement;
  /**
   * number >= 0
   *  - 0:  full black
   *  - 1:  original contrast
   *  - >1: more contrasted than the original
   * */
  contrast: number;
  bitsPerPixel: 1 | 4;
  ditheringAlgorithm: DitheringAlgorithm;
};

export type ProcessorPreviewResult = {
  imageBase64DataUri: string;
  height: number;
  width: number;
};

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
      backgroundPicSrc: string;
    };

export type ProcessorResult = {
  /**
   * Image data that can be displayed in LL
   */
  previewResult: ProcessorPreviewResult;
  /**
   * Image data that can be transfered to the device
   */
  rawResult: ProcessorRawResult;
};
