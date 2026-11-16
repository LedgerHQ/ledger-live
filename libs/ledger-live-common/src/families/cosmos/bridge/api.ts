import { getRedelegations } from "@ledgerhq/coin-cosmos/logic/staking/getRedelegations";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { buildSignRawOperation } from "@ledgerhq/coin-cosmos/signRawOperation";
import {
  resolveSourceValidator,
  resolveTransactionValidators,
} from "@ledgerhq/coin-cosmos/buildTransaction";
import type { CosmosLikeTransaction } from "@ledgerhq/coin-cosmos/types/index";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { executeWithSigner } from "../../../bridge/setup";
import { createSigner } from "../setup";

export function getDeviceSignOptions(
  _transaction: Record<string, unknown>,
  account: Account,
): { hrp: string; signWithPrefix: boolean } {
  const chain = cryptoFactory(account.currency.id);
  return { hrp: chain.prefix, signWithPrefix: chain.signWithPrefix };
}

/**
 * The operation drawer reads the validators off `extra`, so the pending row needs them before the
 * sync brings the confirmed operation. The type and value stay with the generic mode mapping.
 */
export function describeOptimisticOperation(
  mode: string,
  _account: Account,
  transaction: Record<string, unknown>,
): OptimisticOperationDescriptor | undefined {
  if (mode === "send") return undefined;
  const cosmosTransaction = transaction as unknown as CosmosLikeTransaction;
  const sourceValidator = resolveSourceValidator(cosmosTransaction);
  return {
    extra: {
      validators: resolveTransactionValidators(cosmosTransaction),
      ...(sourceValidator ? { sourceValidator } : {}),
    },
  };
}

export default function cosmosBridge(_currency: CryptoCurrency): BridgeApi {
  return {
    stakingSupported: true,
    accountSequenceSupported: true,
    computeIntentType: (transaction: Record<string, unknown>) => {
      const mode = transaction.mode as string | undefined;
      switch (mode) {
        case "send":
        case undefined:
          return "send";
        case "delegate":
        case "undelegate":
        case "redelegate":
        case "claimReward":
        case "compoundReward":
          return mode;
        default:
          throw new Error(`Unsupported Cosmos transaction mode: ${mode}`);
      }
    },
    enrichStakingResources: async (currency, address, _operations, stakingResources) => ({
      ...stakingResources,
      redelegations: await getRedelegations(currency.id, currency.units[1].code, address),
    }),
    describeOptimisticOperation,
    getDeviceSignOptions,
    signRawOperation: buildSignRawOperation(executeWithSigner(createSigner)),
  };
}
