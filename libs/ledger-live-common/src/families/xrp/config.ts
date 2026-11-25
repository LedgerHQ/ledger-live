import { xrpDefaults } from "@ledgerhq/coin-xrp/config";
import type { XrpCoinConfig, XrpTokenStandard } from "@ledgerhq/coin-xrp/config";
import { currencyDefaultsToLiveConfig, getCurrencyConfiguration } from "../../config";

const TOKEN_STANDARDS: XrpTokenStandard[] = ["iou", "mpt"];

export const xrpConfig = currencyDefaultsToLiveConfig({
  ...xrpDefaults,
  // TEMP prototype: tokens on without Firebase
  ripple_testnet: { ...xrpDefaults.ripple_testnet, enabledTokenStandards: TOKEN_STANDARDS },
});

/** Known standards only, without duplicates, sorted: Firebase merges arrays by position */
export function getXrpEnabledTokenStandards(currencyId: string): XrpTokenStandard[] {
  const { enabledTokenStandards = [] } = getCurrencyConfiguration<XrpCoinConfig>(currencyId);

  return TOKEN_STANDARDS.filter(standard => enabledTokenStandards.includes(standard));
}
