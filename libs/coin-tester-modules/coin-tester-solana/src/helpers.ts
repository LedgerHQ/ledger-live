import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import resolver from "@ledgerhq/coin-solana/hw-getAddress";
import type { Signer } from "@ledgerhq/live-common/bridge/generic-alpaca/signer/Solana";
import { getAlpacaCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-alpaca/currencyBridge";
import { getAlpacaAccountBridge } from "@ledgerhq/live-common/bridge/generic-alpaca/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-alpaca/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

export const solana = getCryptoCurrencyById("solana");

export async function getBridges(signer: Signer): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
}> {
  const context: SignerContext<Signer> = (_, fn) => fn(signer);
  const getAddress = resolver(context as unknown as SignerContext<SolanaSigner>);

  return {
    currencyBridge: getAlpacaCurrencyBridge("solana", "local", { context, getAddress }),
    accountBridge: getAlpacaAccountBridge("solana", "local", { context, getAddress }),
    getAddress,
  };
}
