import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { DAPP_SELECTORS } from "@ledgerhq/hw-app-eth";

export const getTxType = (tx: EvmTransaction) => {
  const txSelector = `0x${tx?.data?.toString("hex").substring(0, 8)}`;

  return Object.keys(DAPP_SELECTORS).includes(txSelector) ? DAPP_SELECTORS[txSelector] : "transfer";
};
