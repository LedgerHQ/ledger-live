import { Balance } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import { fetchTronAccountOrFail } from "../network";
import type { AccountTronAPI } from "../network/types";
import { getTronResources } from "./utils";

const bigIntOrZero = (val: number | BigNumber | undefined | null): bigint =>
  BigInt(val?.toString() ?? 0);

export async function getBalance(config: TronCoinConfig, address: string): Promise<Balance[]> {
  const accounts = await fetchTronAccountOrFail(config, address);

  // Same shape as `computeBalance`, which always reports `locked`, so consumers never have to
  // special-case an unactivated account.
  if (accounts.length === 0) return [{ value: 0n, locked: 0n, asset: { type: "native" } }];

  const account = accounts[0];

  const nativeBalance: Balance = computeBalance(account);
  const trc10Balance: Balance[] = extractTrc10Balance(account, address);
  const trc20Balance: Balance[] = extractTrc20Balance(account, address);

  return [nativeBalance].concat(trc10Balance).concat(trc20Balance);
}

// `assetOwner` is populated here only because the generic coin-framework adapter needs it to attach
// token balances to their sub-account. It is not the natural owner of the token, and can be dropped
// from coin-tron once the generic adapter no longer requires it.
function extractTrc10Balance(account: AccountTronAPI, owner: string): Balance[] {
  return (
    account.assetV2?.map(trc => {
      return {
        value: BigInt(trc.value),
        asset: {
          type: "trc10",
          assetReference: trc.key,
          assetOwner: owner,
        },
      };
    }) ?? []
  );
}

function extractTrc20Balance(account: AccountTronAPI, owner: string): Balance[] {
  return account.trc20.map(trc => {
    const [[contractAddress, balance]] = Object.entries(trc);
    return {
      value: BigInt(balance),
      asset: {
        type: "trc20",
        assetReference: contractAddress,
        assetOwner: owner,
      },
    };
  });
}

export function computeBalance(account: AccountTronAPI): Balance {
  const tronResources = getTronResources(account);
  const free = bigIntOrZero(account.balance ?? 0);

  // Everything staked, being unstaked, or delegated away. It counts towards the total balance but
  // cannot pay for a transaction, so it is reported as `locked`: the generic coin framework derives
  // `spendableBalance = value - locked`, and without this a send-max would offer frozen TRX and the
  // broadcast would fail on chain.
  let locked = bigIntOrZero(tronResources.frozen.bandwidth?.amount);
  locked += bigIntOrZero(tronResources.frozen.energy?.amount);
  locked += bigIntOrZero(tronResources.delegatedFrozen.bandwidth?.amount);
  locked += bigIntOrZero(tronResources.delegatedFrozen.energy?.amount);
  locked += sumAmounts(tronResources.unFrozen.energy);
  locked += sumAmounts(tronResources.unFrozen.bandwidth);
  locked += bigIntOrZero(tronResources.legacyFrozen.bandwidth?.amount);
  locked += bigIntOrZero(tronResources.legacyFrozen.energy?.amount);

  return { asset: { type: "native" }, value: free + locked, locked };
}

const sumAmounts = (entries: { amount: BigNumber }[] | null | undefined): bigint =>
  entries?.reduce((total, cur) => total + BigInt(cur.amount.toString()), 0n) ?? 0n;
