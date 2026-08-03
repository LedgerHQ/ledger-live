import { getRedelegations } from "@ledgerhq/coin-cosmos/logic/staking/getRedelegations";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";

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
    // Redelegations can't be a getBalance `Stake`, so the coin-framework leaves them empty — fetch here.
    enrichStakingResources: async (currency, address, _operations, stakingResources) => ({
      ...stakingResources,
      redelegations: await getRedelegations(currency.id, address),
    }),
  };
}
