import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CARDANO_EPOCH_PARAMS_ENDPOINT, CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { APIEpochParams, EpochInfo } from "./api-types";

/**
 * Fetch the current-epoch staking parameters used to compute validator APY (ADR-038 Option 3,
 * served by Ledger's internal Cardano node). When present, reserves/activeStake arrive nested under
 * `adaPots` / `activeStake_aggregate` as JSON numbers, which we flatten + stringify. Each may be absent
 * or null, in which case it's left undefined and APY is omitted.
 * activeStake exceeds 2^53 so JSON.parse rounds it, but it's only used in the APY
 * ratio (error ~1e-16, immaterial).
 */
export async function fetchEpochInfo(currency: CryptoCurrency): Promise<EpochInfo> {
  const { data } = await network<APIEpochParams>({
    method: "GET",
    url: isTestnet(currency)
      ? CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT
      : CARDANO_EPOCH_PARAMS_ENDPOINT,
  });

  const epoch = data?.cardano?.[0]?.currentEpoch;
  if (!epoch) {
    throw new Error("Cardano epoch params: unexpected response shape");
  }

  return {
    number: epoch.number,
    reserves: epoch.adaPots?.reserves?.toString(),
    activeStake: epoch.activeStake_aggregate?.aggregate?.sum?.amount?.toString(),
    params: epoch.protocolParams,
  };
}
