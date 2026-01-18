import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { getAccountBalance, getOperations, getAccountsByPublicKey } from "../network/proxyClient";
import type { ConcordiumAccount, ConcordiumResources } from "../types";

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

export const getAccountShape: GetAccountShape<ConcordiumAccount> = async info => {
  const {
    address,
    currency,
    derivationMode,
    derivationPath,
    index,
    initialAccount,
    rest = {},
    ...nextRest
  } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const publicKey = rest.publicKey || initialAccount?.concordiumResources?.publicKey;

  const accountsResponse = await getAccountsByPublicKey(currency, publicKey);

  let balance = new BigNumber(0);
  let spendableBalance = new BigNumber(0);

  if (!accountsResponse || accountsResponse.length === 0) {
    // No accounts found for this public key - return empty account shape. We're ready to create a new account.
    return {
      balance,
      blockHeight: 0,
      concordiumResources: fillConcordiumResources(initialAccount?.concordiumResources, {
        isOnboarded: false,
      }),
      derivationMode,
      derivationPath,
      id: accountId,
      index,
      operations: [],
      operationsCount: 0,
      rest,
      spendableBalance,
      used: false,
      xpub: address,
      ...nextRest,
    };
  }

  // The actual on-chain account
  const account = accountsResponse[0];

  const balanceResponse = await getAccountBalance(currency, account.address);
  const { finalizedBalance: { accountAmount, accountAtDisposal } = {} } = balanceResponse;

  balance = valueToBigNumber(accountAmount);

  const minReserve = coinConfig.getCoinConfig(currency).minReserve;
  spendableBalance = accountAtDisposal
    ? valueToBigNumber(accountAtDisposal)
    : balance.minus(minReserve);
  spendableBalance = spendableBalance.isNegative() ? new BigNumber(0) : spendableBalance;

  const oldOperations = initialAccount?.operations ?? [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight ?? 0) + 1 : 0;

  const newOperations = await getOperations(currency, account.address, accountId, {
    from: startAt,
    size: 100,
  }).catch((): Operation[] => []);

  const operations = mergeOps(oldOperations, newOperations);

  return {
    balance,
    blockHeight: operations[0]?.blockHeight ?? 0,
    concordiumResources: fillConcordiumResources(initialAccount?.concordiumResources),
    derivationMode,
    derivationPath,
    id: accountId,
    index,
    operations,
    operationsCount: operations.length,
    rest,
    seedIdentifier: initialAccount?.seedIdentifier || "",
    spendableBalance,
    used: balance.isPositive(),
    xpub: address,
    ...nextRest,
  };
};
