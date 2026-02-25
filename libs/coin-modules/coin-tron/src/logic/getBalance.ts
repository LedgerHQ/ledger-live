import { Balance } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import { fetchTronAccount } from "../network";
import type { AccountTronAPI } from "../network/types";
import { getTronResources } from "./utils";

const bigIntOrZero = (val: number | BigNumber | undefined | null): bigint =>
  BigInt(val?.toString() ?? 0);

export async function getBalance(address: string): Promise<Balance[]> {
  const accounts = await fetchTronAccount(address);

  // if account is not activated, an empty balance is returned
  if (accounts.length === 0) return [{ value: BigInt(0), asset: { type: "native" } }];

  const account = accounts[0];

  const nativeBalance: Balance = computeBalance(account);
  const trc10Balance: Balance[] = extractTrc10Balance(account);
  const trc20Balance: Balance[] = extractTrc20Balance(account);

  return [nativeBalance].concat(trc10Balance).concat(trc20Balance);
}

function extractTrc10Balance(account: AccountTronAPI): Balance[] {
  return (
    account.assetV2?.map(trc => {
      return {
        value: BigInt(trc.value),
        asset: {
          type: "trc10",
          assetReference: trc.key,
        },
      };
    }) ?? []
  );
}

function extractTrc20Balance(account: AccountTronAPI): Balance[] {
  return account.trc20.map(trc => {
    const [[contractAddress, balance]] = Object.entries(trc);
    return {
      value: BigInt(balance),
      asset: {
        type: "trc20",
        assetReference: contractAddress,
      },
    };
  });
}

export function computeBalance(account: AccountTronAPI): Balance {
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

  return { asset: { type: "native" }, value: balance };
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
