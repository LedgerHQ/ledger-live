import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { DAPP_SELECTORS } from "@ledgerhq/hw-app-eth";

const fallback = "transfer";

export const getTxType = (tx: EvmTransaction): string => {
  if (!tx || !tx.data) return fallback;

  const txSelector = `0x${tx.data.toString("hex").substring(0, 8)}`;
  const type = DAPP_SELECTORS[txSelector];

  if (!type) return fallback;
  return type;
};
