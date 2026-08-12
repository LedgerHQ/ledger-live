import type { Transaction as EvmTransaction } from "../../families/evm/types";
import { DAPP_SELECTORS } from "@ledgerhq/hw-app-eth";

const PLAIN_TRANSFER = "transfer";
const UNRECOGNISED = "unknown";

export const getTxType = (tx: EvmTransaction): string => {
  if (!tx?.data?.length) return PLAIN_TRANSFER;

  const txSelector = `0x${tx.data.toString("hex").substring(0, 8)}`;
  return DAPP_SELECTORS[txSelector] ?? UNRECOGNISED;
};
