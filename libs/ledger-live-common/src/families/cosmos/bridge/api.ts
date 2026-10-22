import { getRedelegations } from "@ledgerhq/coin-cosmos/logic/staking/getRedelegations";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { buildSignRawOperation } from "@ledgerhq/coin-cosmos/signRawOperation";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { executeWithSigner } from "../../../bridge/setup";
import { createSigner } from "../setup";

export function getDeviceSignOptions(
  _transaction: Record<string, unknown>,
  account: Account,
): { hrp: string; signWithPrefix: boolean } {
  const chain = cryptoFactory(account.currency.id);
  return { hrp: chain.prefix, signWithPrefix: chain.signWithPrefix };
}

const STAKING_MODES = new Set([
  "delegate",
  "undelegate",
  "redelegate",
  "claimReward",
  "compoundReward",
]);

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

// Undelegating or redelegating only moves stake: liquid funds pay the fee alone, as the sync records it.
const STAKE_MOVING_MODES = new Set(["undelegate", "redelegate"]);

/**
 * The operation renderers read the validators from `extra`, as the sync writes them: keep them on
 * the pending row so it does not lose its validator details until that sync replaces it.
 */
export function describeOptimisticOperation(
  mode: string,
  _account: Account,
  transaction: Record<string, unknown>,
): OptimisticOperationDescriptor | undefined {
  if (!STAKING_MODES.has(mode)) return undefined;

  const isRedelegate = mode === "redelegate";
  const address = nonEmptyString(isRedelegate ? transaction.dstValAddress : transaction.valAddress);
  if (!address) return undefined;

  const amount = BigNumber.isBigNumber(transaction.amount) ? transaction.amount : new BigNumber(0);
  const sourceValidator = isRedelegate ? nonEmptyString(transaction.valAddress) : undefined;
  return {
    ...(STAKE_MOVING_MODES.has(mode) ? { value: new BigNumber(0) } : {}),
    extra: {
      validators: [{ address, amount }],
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
