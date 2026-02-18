import {
  PROGRESS_VIEW_OFFSET_LEGACY_ANDROID,
  PROGRESS_VIEW_OFFSET_LEGACY_IOS,
  PROGRESS_VIEW_OFFSET_WALLET40_ANDROID,
  PROGRESS_VIEW_OFFSET_WALLET40_IOS,
} from "../constants";

export function getProgressViewOffset(platform: string, isWallet40MainNav: boolean): number {
  if (platform === "android") {
    return isWallet40MainNav
      ? PROGRESS_VIEW_OFFSET_WALLET40_ANDROID
      : PROGRESS_VIEW_OFFSET_LEGACY_ANDROID;
  }
  return isWallet40MainNav ? PROGRESS_VIEW_OFFSET_WALLET40_IOS : PROGRESS_VIEW_OFFSET_LEGACY_IOS;
}
