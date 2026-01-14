import {
  assetsLeftElementOptions,
  assetsRightElementOptions,
  networksLeftElementOptions,
  networksRightElementOptions,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

const toHumanLabel = (value: string): string => {
  if (value === "undefined") return "Undefined";
  const withSpaces = value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return withSpaces
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const toPickerOptions = <T extends readonly string[]>(values: T) =>
  values.map(v => ({ label: toHumanLabel(v), value: v }));

export const assetLeftOptions = toPickerOptions(assetsLeftElementOptions);
export const assetRightOptions = toPickerOptions(assetsRightElementOptions);
export const networkLeftOptions = toPickerOptions(networksLeftElementOptions);
export const networkRightOptions = toPickerOptions(networksRightElementOptions);
