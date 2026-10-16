import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import { fetchTronAccount, getTronAccountNetwork } from "../network";
import type { TronResourcesRaw } from "../types";
import { toTronResourcesRaw } from "../types/serialization";
import { fetchTronResources } from "./tronResources";

/**
 * Tron-specific account metadata exposed through the generic `getAccountInfo`
 * contract (ADR-045). The framework contract is the open `AccountInfo` type
 * (`{ type: string } & Record<string, unknown>`); each family keeps its concrete
 * shape internally, discriminated by `type`.
 *
 * - `energyLimit` — total energy limit (raw `EnergyLimit` from the node).
 * - `energy` — *available* energy, i.e. `max(0, EnergyLimit - EnergyUsed)`.
 * - `bandwidth` — *available* bandwidth: the free daily allowance plus the
 *   staked (net) allowance, both net of what has already been used, mirroring
 *   the availability convention used in `estimateFees`.
 * - `activated` — false when TronGrid knows no account at this address.
 * - `resources` — the account's `tronResources` (frozen and unfrozen amounts, votes, reward, the
 *   four raw bandwidth limits) in their JSON form; present only when `activated`.
 */
export type TronAccountInfo = {
  type: "tron";
  energyLimit: number;
  energy: number;
  bandwidth: number;
  activated: boolean;
  resources?: TronResourcesRaw;
};

export async function getAccountInfo(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
): Promise<AccountInfo> {
  const [networkInfo, accounts] = await Promise.all([
    getTronAccountNetwork(logger, config, address),
    fetchTronAccount(logger, config, address),
  ]);

  const energy = BigNumber.maximum(0, networkInfo.energyLimit.minus(networkInfo.energyUsed));
  const freeBandwidth = BigNumber.maximum(
    0,
    networkInfo.freeNetLimit.minus(networkInfo.freeNetUsed),
  );
  const stakedBandwidth = BigNumber.maximum(0, networkInfo.netLimit.minus(networkInfo.netUsed));
  const bandwidth = freeBandwidth.plus(stakedBandwidth);

  const accountInfo: TronAccountInfo = {
    type: "tron",
    energyLimit: networkInfo.energyLimit.toNumber(),
    energy: energy.toNumber(),
    bandwidth: bandwidth.toNumber(),
    activated: accounts.length > 0,
  };
  if (accounts.length > 0) {
    accountInfo.resources = toTronResourcesRaw(
      await fetchTronResources(logger, config, accounts[0]),
    );
  }

  return accountInfo;
}
