import type { TransactionInfo } from "@ledgerhq/wallet-btc/types";

export const EMPTY_WALLET_TX: TransactionInfo = {
  inputs: [],
  associatedDerivations: [],
  outputs: [],
  fee: 0,
  changeAddress: { account: 1, index: 0, address: "" },
};
