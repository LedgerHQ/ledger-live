import { useMemo } from "react";
import { Image } from "react-native";

export function resolveLottieAsset(
  assetRequire: number | { uri: string; [key: string]: unknown },
): { uri: string } {
  const assetSource = Image.resolveAssetSource(assetRequire);
  return { uri: assetSource.uri };
}

export function useLottieAsset(assetRequire: number | { uri: string; [key: string]: unknown }): {
  uri: string;
} {
  return useMemo(() => resolveLottieAsset(assetRequire), [assetRequire]);
}
