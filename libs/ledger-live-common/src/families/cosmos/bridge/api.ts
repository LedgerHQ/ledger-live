import { getRedelegations } from "@ledgerhq/coin-cosmos/logic/staking/getRedelegations";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";

export function getDeviceSignOptions(
  _transaction: Record<string, unknown>,
  account: Account,
): { hrp: string; signWithPrefix: boolean } {
  const chain = cryptoFactory(account.currency.id);
  return { hrp: chain.prefix, signWithPrefix: chain.signWithPrefix };
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
    enrichStakingResources: async (currency, address, _operations, stakingResources) => ({
      ...stakingResources,
      redelegations: await getRedelegations(currency.id, address),
    }),
    getDeviceSignOptions,
  };
}
