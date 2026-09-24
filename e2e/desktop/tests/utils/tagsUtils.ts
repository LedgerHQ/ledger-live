import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";

export const DEVICE_TAGS = ["@Stax", "@Flex", "@NanoGen5", "@NanoSP", "@NanoX", "@LNS"] as const;

type DeviceTag = (typeof DEVICE_TAGS)[number];
export const SCREEN_DEVICE_TAGS = ["@Stax", "@Flex", "@NanoGen5"] satisfies DeviceTag[];
export const BUTTON_DEVICE_TAGS = ["@NanoSP", "@NanoX", "@LNS"] satisfies DeviceTag[];

const LNS_UNSUPPORTED_CURRENCIES = new Set([
  Currency.SUI.id,
  Currency.VET.id,
  Currency.HBAR.id,
  Currency.ALEO.id,
]);

export function shouldSkipLNSTag(currencyId: string): boolean {
  return LNS_UNSUPPORTED_CURRENCIES.has(currencyId);
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

function currencyTags(currencyId: string): string[] {
  const family = getFamilyByCurrencyId(currencyId);
  return [`@${currencyId}`, ...(family ? [`@family-${family}`] : [])];
}

export function buildTags(params: {
  currencyId?: string;
  skipLNS?: boolean;
  extraTags?: string[];
}): string[] {
  const { currencyId, skipLNS = false, extraTags = [] } = params;
  return [
    ...(skipLNS ? deviceTagsWithoutLNS() : deviceTags()),
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
