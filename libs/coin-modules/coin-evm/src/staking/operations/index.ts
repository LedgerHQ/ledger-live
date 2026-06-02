import type { StakingOperation } from "../../types/staking";
import celoProtocol from "./celo";
import monadProtocol from "./monad";
import seiProtocol from "./sei";
import type { OperationParams, StakingProtocol } from "./types";

const STAKING_PROTOCOLS: Record<string, StakingProtocol> = {
  sei_evm: seiProtocol as StakingProtocol,
  celo: celoProtocol as StakingProtocol,
  monad: monadProtocol as StakingProtocol,
};

export const buildTransactionParams = (
  currencyId: string,
  transactionType: StakingOperation,
  params: OperationParams,
): Array<string | bigint> => {
  const protocol = STAKING_PROTOCOLS[currencyId];
  if (!protocol) {
    throw new Error(`Unsupported staking currency: ${currencyId}`);
  }

  const operation = protocol[transactionType];
  if (!operation) {
    throw new Error(`Unsupported transaction type for ${currencyId}: ${transactionType}`);
  }

  if (!params.valAddress && ["celo", "sei_evm"].includes(currencyId)) {
    throw new Error(`${currencyId} staking requires valAddress`);
  }

  if (!params.valId && currencyId === "monad") {
    throw new Error(`${currencyId} staking requires valId`);
  }

  return operation(params);
};
