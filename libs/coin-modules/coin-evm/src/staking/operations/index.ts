import type { StakingOperation } from "../../types/staking";
import celoProtocol from "./celo";
import monadProtocol from "./monad";
import seiProtocol from "./sei";
import zeroGravityProtocol from "./zero_gravity";
import somniaProtocol from "./somnia";
import type { OperationParams, StakingProtocol } from "./types";

const STAKING_PROTOCOLS: Record<string, StakingProtocol> = {
  sei_evm: seiProtocol as StakingProtocol,
  celo: celoProtocol as StakingProtocol,
  monad: monadProtocol as StakingProtocol,
  zero_gravity: zeroGravityProtocol as StakingProtocol,
  somnia: somniaProtocol as StakingProtocol,
};

const REQUIRES_VAL_ADDRESS = new Set(["celo", "sei_evm", "somnia"]);

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

  if (!params.valAddress && REQUIRES_VAL_ADDRESS.has(currencyId)) {
    throw new Error(`${currencyId} staking requires valAddress`);
  }

  if (!params.valId && currencyId === "monad") {
    throw new Error(`${currencyId} staking requires valId`);
  }

  if (!params.delegator && currencyId === "zero_gravity") {
    throw new Error(`${currencyId} staking requires delegator`);
  }

  if (currencyId === "zero_gravity" && transactionType === "undelegate") {
    if (params.shares === undefined || params.shares < 1_000_000_000n) {
      throw new Error(`${currencyId} undelegate requires shares`);
    }
  }

  if (
    params.withdrawId === undefined &&
    currencyId === "monad" &&
    (transactionType === "undelegate" || transactionType === "withdraw")
  ) {
    throw new Error(`${currencyId} ${transactionType} requires withdrawId`);
  }

  return operation(params);
};
