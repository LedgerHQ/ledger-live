import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { type GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Operation } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import coinConfig from "../config";
import {
  getAccountBalance,
  getAccountsByPublicKey,
  getConsensusInfo,
} from "../network/proxyClient";
import { listOperations } from "../logic/history/listOperations";
import type { ConcordiumAccount, ConcordiumResources } from "../types";
import { mapRawOperationToBridgeOperation } from "./serialization";

const fillConcordiumResources = (
  existing: Partial<ConcordiumResources> = {},
  incoming: Partial<ConcordiumResources> = {},
): ConcordiumResources => ({
  credId: "",
  credNumber: 0,
  identityIndex: 0,
  ipIdentity: 0,
  isOnboarded: false,
  publicKey: "",
  ...existing,
  ...incoming,
});

const valueToBigNumber = (value?: string | number): BigNumber => {
  const result = new BigNumber(value ?? 0);
  return result.isNaN() ? new BigNumber(0) : result;
};

export async function getBalance(
  currencyId: string,
  address: string,
): Promise<{ balance: BigNumber; spendableBalance: BigNumber }> {
  const { finalizedBalance: { accountAmount, accountAtDisposal } = {} } = await getAccountBalance(
    currencyId,
    address,
  ).catch((error): { finalizedBalance: { accountAmount: string; accountAtDisposal: string } } => {
    log("concordium-sync", `Error fetching balance for account with address ${address}`, {
      error,
    });
    return { finalizedBalance: { accountAmount: "0", accountAtDisposal: "0" } };
  });

  const balance = valueToBigNumber(accountAmount);
  const minReserve = coinConfig.getCoinConfig(currencyId).minReserve;

  let spendableBalance = accountAtDisposal
    ? valueToBigNumber(accountAtDisposal)
    : balance.minus(minReserve);
  spendableBalance = spendableBalance.isNegative() ? new BigNumber(0) : spendableBalance;

  return { balance, spendableBalance };
}

export async function syncOperations(
  currencyId: string,
  address: string,
  accountId: string,
  oldOperations: Operation[],
): Promise<Operation[]> {
  const lastBlockHeight = oldOperations[0]?.blockHeight ?? 0;
  const minHeight = lastBlockHeight > 0 ? lastBlockHeight + 1 : 0;

  const result = await listOperations(
    address,
    { minHeight, limit: 100, order: "desc" },
    currencyId,
  ).catch(error => {
    log("concordium-sync", `Error fetching operations for account with address ${address}`, {
      error,
    });
    return { items: [] as const, next: undefined };
  });

  const newOperations = result.items.map(op => mapRawOperationToBridgeOperation(op, accountId));
  return mergeOps(oldOperations, newOperations);
}

export const getAccountShape: GetAccountShape<ConcordiumAccount> = async info => {
  const { currency, derivationMode, derivationPath, index, initialAccount, rest = {} } = info;

  const publicKey = rest.publicKey || initialAccount?.concordiumResources?.publicKey;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  try {
    const accountsResponse = await getAccountsByPublicKey(currency.id, publicKey);

    if (!accountsResponse?.length) {
      return {
        balance: new BigNumber(0),
        blockHeight: 0,
        concordiumResources: fillConcordiumResources(initialAccount?.concordiumResources, {
          publicKey,
          isOnboarded: false,
        }),
        derivationMode,
        derivationPath,
        id: accountId,
        index,
        operations: [],
        operationsCount: 0,
        spendableBalance: new BigNumber(0),
        used: false,
        xpub: publicKey,
      };
    }

    const account = accountsResponse[0];

    const [{ balance, spendableBalance }, operations, blockHeight] = await Promise.all([
      getBalance(currency.id, account.address),
      syncOperations(currency.id, account.address, accountId, initialAccount?.operations ?? []),
      getConsensusInfo(currency.id)
        .then(info => info.lastFinalizedBlockHeight)
        .catch(() => 0),
    ]);

    return {
      balance,
      blockHeight,
      concordiumResources: fillConcordiumResources(initialAccount?.concordiumResources, {
        isOnboarded: true,
        publicKey,
      }),
      freshAddress: account.address,
      seedIdentifier: publicKey,
      derivationMode,
      derivationPath,
      id: accountId,
      index,
      operations,
      operationsCount: operations.length,
      spendableBalance,
      used: true,
      xpub: publicKey,
    };
  } catch (error) {
    log("concordium-sync", `Error fetching account shape for public key ${publicKey}`, { error });

    throw error;
  }
};
