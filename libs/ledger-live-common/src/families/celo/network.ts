import type { CeloConfigInfo } from "@ledgerhq/coin-celo/config";
import { getCeloTransactionFeeCurrency as getFeeCurrencyFromConfig } from "@ledgerhq/coin-celo/network/sdk";
import { getCurrencyConfiguration } from "../../config";

export const getCeloTransactionFeeCurrency = (hash: string) =>
  getFeeCurrencyFromConfig(getCurrencyConfiguration<CeloConfigInfo>("celo"), hash);
