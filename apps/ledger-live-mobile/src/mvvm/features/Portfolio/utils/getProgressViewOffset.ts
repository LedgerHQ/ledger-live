import {
  PROGRESS_VIEW_OFFSET_WALLET40_ANDROID,
  PROGRESS_VIEW_OFFSET_WALLET40_IOS,
} from "../constants";

export function getProgressViewOffset(platform: string): number {
  if (platform === "android") {
    return PROGRESS_VIEW_OFFSET_WALLET40_ANDROID;
  }
  return PROGRESS_VIEW_OFFSET_WALLET40_IOS;
}
