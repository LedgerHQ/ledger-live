import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CARDANO_EPOCH_PARAMS_ENDPOINT, CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";
import { APIEpochParams, EpochInfo } from "./api-types";

/**
 * Fetch the current-epoch staking parameters used to compute validator APY (ADR-038 Option 3,
 * served by Ledger's internal Cardano node). The endpoint currently returns only a0/rho/tau and
 * the epoch number; `reserves` and `activeStake` are parsed when present (LIVE-18622) and left
 * undefined otherwise, which keeps APY omitted until the data is exposed.
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
    reserves: epoch.reserves,
    activeStake: epoch.activeStake,
    params: epoch.protocolParams,
  };
}
