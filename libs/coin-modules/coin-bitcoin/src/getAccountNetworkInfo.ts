import flow from "lodash/flow";
import { BigNumber } from "bignumber.js";
import type { NetworkInfo } from "./types";
import { getWalletAccount } from "./getWalletAccount";
import { Account } from "@ledgerhq/types-live";
import { BitcoinInfrastructureError } from "./errors";
import { getRelayFeeFloorSatVb } from "@ledgerhq/wallet-btc/utils";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/index";
import { zcashSafeFeePerByte } from "./chain-adapters/zcash/transparent-fee-rate";
const speeds = ["fast", "medium", "slow"];

/**
 * Zcash prices transactions with ZIP-317 (per logical action), not with a
 * sat/vByte fee market, so there is nothing to read from the explorer here. The
 * rate below is the one that covers ZIP-317 for any layout; `prepareTransaction`
 * then tightens it to the actual transaction through the chain adapter's
 * `resolveFeePerByte`. See https://zips.z.cash/zip-0317 and LIVE-35152.
 */
function getZcashNetworkInfo(
  walletAccount: WalletAccount,
  relayFeePerByte: BigNumber,
): NetworkInfo {
  const { crypto, derivationMode } = walletAccount.xpub;
  const feePerByte = BigNumber.max(zcashSafeFeePerByte(crypto, derivationMode), relayFeePerByte);

  // Zcash has no fee market: the three speeds all resolve to the same ZIP-317
  // rate. A "custom" fee remains available for advanced users via the UI.
  return {
    family: "bitcoin",
    feeItems: {
      items: speeds.map((speed, i) => ({ key: String(i), speed, feePerByte })),
      defaultFeePerByte: feePerByte,
    },
    relayFeePerByte,
  };
}

// Clamp each level to ≥ floor + ε and return integers
export function clamp(
  floor: BigNumber,
  epsilon: BigNumber = new BigNumber(1), // +1 sat/vB safety
): (f: BigNumber) => BigNumber {
  const threshold = floor.plus(epsilon);
  return (f: BigNumber) => BigNumber.max(f, threshold).integerValue(BigNumber.ROUND_CEIL);
}

export function avoidDups(nums: Array<BigNumber>): Array<BigNumber> {
  nums = nums.slice(0);

  for (let i = nums.length - 2; i >= 0; i--) {
    if (nums[i + 1].gte(nums[i])) {
      nums[i] = nums[i + 1].plus(1);
    }
  }

  return nums;
}
export async function getAccountNetworkInfo(account: Account): Promise<NetworkInfo> {
  const walletAccount = getWalletAccount(account);
  const floorSatPerVB = await getRelayFeeFloorSatVb(walletAccount.xpub.explorer);

  // Zcash: price with ZIP-317 instead of the explorer's (Bitcoin-scale) fee data.
  if (account.currency.id === "zcash") {
    return getZcashNetworkInfo(walletAccount, floorSatPerVB);
  }

  const rawFees = await walletAccount.xpub.explorer.getFees();

  // Convoluted logic to convert from:
  // { "2": 2435, "3": 1241, "6": 1009, "last_updated": 1627973170 }
  // to:
  // { 2435, 1241, 1009 }
  const feesPerByte: BigNumber[] = flow([
    // Remove the 'last_updated' key
    Object.entries,
    entries => entries.filter(([key]: [string]) => !isNaN(Number(key))),
    // Reconstruct the array with only the values
    Object.fromEntries,
    Object.values,
    // Safety against invalid data
    f => f.filter((f: unknown) => typeof f === "number"),
    // Normalize values
    f => f.map((f: number) => new BigNumber(f).div(1000).integerValue(BigNumber.ROUND_CEIL)),
    avoidDups,
  ])(rawFees);

  if (feesPerByte.length !== 3) {
    throw new BitcoinInfrastructureError();
  }

  // --- Enforce dynamic floor and preserve strict ordering ---
  let clamped = feesPerByte.map(clamp(floorSatPerVB));
  clamped = avoidDups(clamped);

  const feeItems = {
    items: clamped.map((feePerByte, i: number) => ({
      key: String(i),
      speed: speeds[i],
      feePerByte,
    })),
    defaultFeePerByte: clamped[Math.floor(clamped.length / 2)] || new BigNumber(0),
  };
  // BTC enforces a 1 sat/vB floor (Bitcoin Core's minrelaytxfee default); other coins use the node value as-is
  const relayFeePerByte =
    account.currency.id === "bitcoin" ? BigNumber.max(floorSatPerVB, 1) : floorSatPerVB;

  return {
    family: "bitcoin",
    feeItems,
    relayFeePerByte,
  };
}
