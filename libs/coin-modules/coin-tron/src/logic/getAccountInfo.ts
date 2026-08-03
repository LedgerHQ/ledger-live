import { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import BigNumber from "bignumber.js";
import { getTronAccountNetwork } from "../network";

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
 */
export type TronAccountInfo = {
  type: "tron";
  energyLimit: number;
  energy: number;
  bandwidth: number;
};

export async function getAccountInfo(address: string): Promise<AccountInfo> {
  const networkInfo = await getTronAccountNetwork(address);

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
  };

  return accountInfo;
}
