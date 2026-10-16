import type { StringMemo, TxDataNotSupported } from "@ledgerhq/coin-module-framework/api/types";
import type { HederaContext } from "./config";

export type HederaMemo = StringMemo;

export type HederaTxData =
  | TxDataNotSupported
  | {
      type: "erc20";
      gasLimit: bigint;
    }
  | {
      type: "staking";
      stakingNodeId: number | null | undefined;
    };

/**
 * What coin-hedera's `createApi()` offers beyond `CoinModuleImpl`.
 *
 * `getAddressesForPublicKey` lists the accounts a public key controls, as the mirror node knows
 * them: the network assigns Hedera account ids, so a scan cannot derive them from the key.
 */
export type HederaCoinModuleExtensions = {
  getAddressesForPublicKey: (context: HederaContext, publicKey: string) => Promise<string[]>;
};
