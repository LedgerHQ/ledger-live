import BigNumber from "bignumber.js";
import { fetchTronAccount } from "../network";
import type { AccountTronAPI } from "../network/types";
import { getTronResources } from "./utils";
import { Asset as CoreAsset } from "@ledgerhq/coin-framework/api/index";

const bigIntOrZero = (val: number | BigNumber | undefined | null): bigint =>
  BigInt(val?.toString() ?? 0);

// type AssetTree = {
//   native: bigint;
//   tokens: Asset[];
// };
export type AssetTree = CoreAsset & {
  tokens: Asset[];
};

export async function getBalance(address: string): Promise<AssetTree> {
  const accounts = await fetchTronAccount(address);
  const account = accounts[0];

  return {
    native: computeBalance(account),
    tokens: extractTrc10Balance(account).concat(extractTrc20Balance(account)),
  } satisfies AssetTree;
}

type Asset = {
  standard: "trc10" | "trc20";
  contractAddress: string;
  balance: bigint;
};

function extractTrc10Balance(account: AccountTronAPI): Asset[] {
  return (
    account.assetV2?.map(trc => {
      return {
        standard: "trc10",
        contractAddress: trc.key,
        balance: BigInt(trc.value),
      } satisfies Asset;
    }) ?? []
  );
}

function extractTrc20Balance(account: AccountTronAPI): Asset[] {
  return account.trc20.map(trc => {
    const [[contractAddress, balance]] = Object.entries(trc);
    return {
      standard: "trc20",
      contractAddress,
      balance: BigInt(balance),
    } satisfies Asset;
  });
}

export function computeBalance(account: AccountTronAPI): bigint {
  const tronResources = getTronResources(account);

  let balance = bigIntOrZero(account.balance ?? 0);
  balance += bigIntOrZero(tronResources.frozen.bandwidth?.amount);
  balance += bigIntOrZero(tronResources.frozen.energy?.amount);
  balance += bigIntOrZero(tronResources.delegatedFrozen.bandwidth?.amount);
  balance += bigIntOrZero(tronResources.delegatedFrozen.energy?.amount);
  balance += tronResources.unFrozen.energy
    ? tronResources.unFrozen.energy.reduce((accum, cur) => {
        return accum + BigInt(cur.amount.toString());
      }, BigInt(0))
    : BigInt(0);
  balance += tronResources.unFrozen.bandwidth
    ? tronResources.unFrozen.bandwidth.reduce((accum, cur) => {
        return accum + BigInt(cur.amount.toString());
      }, BigInt(0))
    : BigInt(0);
  balance += bigIntOrZero(tronResources.legacyFrozen.bandwidth?.amount);
  balance += bigIntOrZero(tronResources.legacyFrozen.energy?.amount);

  return balance;
}

export function computeBalanceBridge(account: AccountTronAPI): BigNumber {
  const tronResources = getTronResources(account);

  const spendableBalance = account.balance ? new BigNumber(account.balance) : new BigNumber(0);
  const balance = spendableBalance
    .plus(tronResources.frozen.bandwidth ? tronResources.frozen.bandwidth.amount : new BigNumber(0))
    .plus(tronResources.frozen.energy ? tronResources.frozen.energy.amount : new BigNumber(0))
    .plus(
      tronResources.delegatedFrozen.bandwidth
        ? tronResources.delegatedFrozen.bandwidth.amount
        : new BigNumber(0),
    )
    .plus(
      tronResources.delegatedFrozen.energy
        ? tronResources.delegatedFrozen.energy.amount
        : new BigNumber(0),
    )

    .plus(
      tronResources.unFrozen.energy
        ? tronResources.unFrozen.energy.reduce((accum, cur) => {
            return accum.plus(cur.amount);
          }, new BigNumber(0))
        : new BigNumber(0),
    )
    .plus(
      tronResources.unFrozen.bandwidth
        ? tronResources.unFrozen.bandwidth.reduce((accum, cur) => {
            return accum.plus(cur.amount);
          }, new BigNumber(0))
        : new BigNumber(0),
    )
    .plus(
      tronResources.legacyFrozen.bandwidth
        ? tronResources.legacyFrozen.bandwidth.amount
        : new BigNumber(0),
    )
    .plus(
      tronResources.legacyFrozen.energy
        ? tronResources.legacyFrozen.energy.amount
        : new BigNumber(0),
    );

  return balance;
}
