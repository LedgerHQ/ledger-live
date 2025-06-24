import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/lib/types/transaction";
import { ERC20_CLEAR_SIGNED_SELECTORS, DAPP_SELECTORS } from "@ledgerhq/hw-app-eth";

export const getTxType = (tx: EvmTransaction) => {
  const txSelector = `0x${tx?.data?.toString("hex").substring(0, 8)}`;

  if (Object.values<string>(ERC20_CLEAR_SIGNED_SELECTORS).includes(txSelector)) {
    const erc20TypeMap: Record<string, string> = {
      [ERC20_CLEAR_SIGNED_SELECTORS.TRANSFER]: "transfer",
      [ERC20_CLEAR_SIGNED_SELECTORS.APPROVE]: "approve",
    };

    return erc20TypeMap[txSelector];
  }

  if (Object.keys(DAPP_SELECTORS).includes(txSelector)) {
    return DAPP_SELECTORS[txSelector];
  }

  return "transfer";
};
