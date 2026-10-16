import BigNumber from "bignumber.js";
import type { CosmosRedelegationRaw } from "@ledgerhq/coin-cosmos/types/index";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import { buildSignRawOperation } from "@ledgerhq/coin-cosmos/signRawOperation";
import type { BridgeApi, ChainReads } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type {
  Account,
  Operation,
  StakingRedelegation,
  StakingResources,
} from "@ledgerhq/types-live";
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
 * The redelegations in progress, as coin-cosmos reports them in its account metadata (ADR-045, JSON
 * form). A failed read rejects: the sync keeps the base staking resources.
 */
export async function enrichStakingResources(
  _currency: CryptoCurrency,
  address: string,
  _operations: Operation[],
  stakingResources: StakingResources,
  chain: ChainReads,
): Promise<StakingResources> {
  const info = await chain.getAccountInfo(address);
  const reported =
    info.type === "cosmos" && Array.isArray(info.redelegations)
      ? (info.redelegations as CosmosRedelegationRaw[])
      : [];
  const redelegations: StakingRedelegation[] = reported.map(
    ({ validatorSrcAddress, validatorDstAddress, amount, completionDate }) => ({
      validatorSrcAddress,
      validatorDstAddress,
      amount: new BigNumber(amount),
      completionDate: new Date(completionDate),
    }),
  );
  return { ...stakingResources, redelegations };
}

export default function cosmosBridge(_currency: CryptoCurrency): BridgeApi {
  return {
    stakingSupported: true,
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
    enrichStakingResources,
    getDeviceSignOptions,
    signRawOperation: buildSignRawOperation(executeWithSigner(createSigner)),
  };
}
