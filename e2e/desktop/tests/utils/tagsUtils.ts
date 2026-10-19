import { isCurrencyUnsupportedOnLNS } from "@ledgerhq/live-e2e-shared/nanoSSupport";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";

export const DEVICE_TAGS = ["@Stax", "@Flex", "@NanoGen5", "@NanoSP", "@NanoX", "@LNS"] as const;

type DeviceTag = (typeof DEVICE_TAGS)[number];
export const SCREEN_DEVICE_TAGS = ["@Stax", "@Flex", "@NanoGen5"] satisfies DeviceTag[];
export const BUTTON_DEVICE_TAGS = ["@NanoSP", "@NanoX", "@LNS"] satisfies DeviceTag[];

export function shouldSkipLNSTag(currencyId: string): boolean {
  return isCurrencyUnsupportedOnLNS(currencyId);
}

function deviceTags(): string[] {
  return [...DEVICE_TAGS];
}

export function deviceTagsWithoutLNS(): string[] {
  return DEVICE_TAGS.filter(tag => tag !== "@LNS");
}

export function deviceWithScreenTags(): string[] {
  return SCREEN_DEVICE_TAGS;
}

export function deviceWithButtonTags(): string[] {
  return BUTTON_DEVICE_TAGS;
}

function currencyTags(currencyId: string): string[] {
  const family = getFamilyByCurrencyId(currencyId);
  return [`@${currencyId}`, ...(family ? [`@family-${family}`] : [])];
}

function selectedDeviceTags(skipLNS: boolean, onlyLNS: boolean): string[] {
  if (onlyLNS) return ["@LNS"];
  return skipLNS ? deviceTagsWithoutLNS() : deviceTags();
}

export function buildTags(params: {
  currencyId?: string;
  skipLNS?: boolean;
  onlyLNS?: boolean;
  extraTags?: string[];
}): string[] {
  const { currencyId, skipLNS = false, onlyLNS = false, extraTags = [] } = params;
  return [
    ...selectedDeviceTags(skipLNS, onlyLNS),
    ...(currencyId ? currencyTags(currencyId) : []),
    ...extraTags,
  ];
}

export function buildSwapTags(params: {
  debitCurrencyId: string;
  creditCurrencyId: string;
  skipLNS?: boolean;
  extraTags?: string[];
}): string[] {
  const { debitCurrencyId, creditCurrencyId, skipLNS = false, extraTags = [] } = params;
  return [
    ...(skipLNS ? deviceTagsWithoutLNS() : deviceTags()),
    ...currencyTags(debitCurrencyId),
    ...currencyTags(creditCurrencyId),
    ...extraTags,
  ];
}
