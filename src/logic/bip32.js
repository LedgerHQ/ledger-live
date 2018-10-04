// @flow

type SplitConfig = {
  coinType: number,
};

export const isSegwitPath = (path: string): boolean => path.startsWith("49'");

export const isUnsplitPath = (path: string, splitConfig: ?SplitConfig) => {
  try {
    const coinType = parseInt(path.split("/")[1], 10);
    return splitConfig ? coinType === splitConfig.coinType : false;
  } catch (e) {
    return false;
  }
};
