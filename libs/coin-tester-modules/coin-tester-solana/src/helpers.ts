import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import {
  solanaGetAddress,
  SolanaSigner as CoinFrameworkSolanaSigner,
} from "@ledgerhq/live-common/families/solana/signer";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Signers } from "./signer";

registerCoinModules(coinModuleLoaders);

export const solana = getCryptoCurrencyById("solana");

export async function getBridges(signers: Signers): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const coinframeworkSignerContext: SignerContext<CoinFrameworkSolanaSigner> = (_, fn) =>
    fn(signers.coinframework);
  const coinframeworkGetAddress = solanaGetAddress(coinframeworkSignerContext);

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("solana", "local", {
      context: coinframeworkSignerContext,
      getAddress: coinframeworkGetAddress,
    }),
    accountBridge: await getCoinFrameworkAccountBridge("solana", "local", {
      context: coinframeworkSignerContext,
      getAddress: coinframeworkGetAddress,
    }),
    getAddress: coinframeworkGetAddress,
  };
}
