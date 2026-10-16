import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { requireExtension } from "@ledgerhq/portfolio-module-framework";
import type { Account } from "@ledgerhq/types-live";
import { buildContext } from "../api/context";
import { isPortfolioEnabledFor } from "./config";
import { openNetworkPortfolio, type NetworkPortfolio, type PortfolioDeps } from "./network";

/**
 * What signing a transaction built elsewhere (wallet-api, a dApp) needs from the chain: the
 * sender's next sequence, the transaction wrapped for the device, and its signed form.
 */
export type RawWriteApi = {
  getNextSequence: (sender: string) => Promise<bigint>;
  /** The unsigned transaction the device signs. */
  craftRawTransaction: (
    transaction: string,
    sender: string,
    publicKey: string,
    sequence: bigint,
  ) => Promise<string>;
  combine: (unsigned: string, signature: string, publicKey: string) => Promise<string>;
};

/**
 * The raw signing writes of an account: through the portfolio layer when the coin config of its
 * currency enables it (`portfolio.enabled`), with the coin module otherwise. The sequence is still
 * read first and handed to the encoding, as the legacy path does; a side that does not encode raw
 * transactions (the portfolio-service) fails with METHOD_NOT_ALLOWED.
 */
export function rawWriteApi(
  coinModuleApi: CoinModuleApi<any, any, any>,
  account: Account,
  bridgeApi: Pick<BridgeApi, "accountModule"> & PortfolioDeps["bridgeApi"] = {},
): RawWriteApi {
  const { currency } = account;
  const context = buildContext(currency.id);
  if (!isPortfolioEnabledFor(currency.id)) {
    return {
      getNextSequence: sender => coinModuleApi.getNextSequence(context, sender),
      craftRawTransaction: async (transaction, sender, publicKey, sequence) =>
        (await coinModuleApi.craftRawTransaction(context, transaction, sender, publicKey, sequence))
          .transaction,
      combine: async (unsigned, signature, publicKey) =>
        coinModuleApi.combine(context, unsigned, [signature], { pubkey: publicKey }),
    };
  }

  let opening: Promise<NetworkPortfolio> | undefined;
  const opened = () =>
    (opening ??= openNetworkPortfolio(
      currency,
      { binding: bridgeApi.accountModule, coinModuleApi, context, bridgeApi },
      "write",
    ));
  return {
    getNextSequence: async sender => {
      const { portfolio, network } = await opened();
      return BigInt((await portfolio.getNextSequence(network, sender)).value);
    },
    craftRawTransaction: async (transaction, sender, senderPublicKey, sequence) => {
      const { portfolio, network } = await opened();
      const { rawTransaction } = await requireExtension(portfolio, "encodeRawTransaction")(
        network,
        { transaction, sender, senderPublicKey, sequence: sequence.toString() },
      );
      return rawTransaction;
    },
    combine: async (rawTransaction, signature, pubkey) => {
      const { portfolio, network } = await opened();
      const { signedTransaction } = await portfolio.combineTransaction(network, {
        rawTransaction,
        signature,
        pubkey,
      });
      return signedTransaction;
    },
  };
}
