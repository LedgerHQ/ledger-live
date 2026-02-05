import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import coinConfig from "../config";
import {
  getAccountBalance,
  getOperations,
  getAccountsByPublicKey,
  ProxyOperation,
} from "../network/proxyClient";
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

const proxyOperationToLiveOperation = (op: ProxyOperation): Operation => ({
  id: op.id,
  hash: op.hash,
  accountId: op.accountId,
  type: op.type as OperationType,
  value: op.value,
  fee: op.fee,
  blockHash: op.blockHash,
  blockHeight: op.blockHeight,
  senders: op.senders,
  recipients: op.recipients,
  date: op.date,
  transactionSequenceNumber: op.transactionSequenceNumber,
  extra: op.extra,
});

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

  let balance = new BigNumber(0);
  let spendableBalance = new BigNumber(0);

  try {
    const accountsResponse = await getAccountsByPublicKey(currency, publicKey);

    if (!accountsResponse?.length) {
      return {
        balance,
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
        spendableBalance,
        used: false,
        xpub: publicKey,
      };
    }

    // The actual concordium on-chain address, associated with the given public key.
    const account = accountsResponse[0];

    const { finalizedBalance: { accountAmount, accountAtDisposal } = {} } = await getAccountBalance(
      currency,
      account.address,
    ).catch(error => {
      // If balance request fails, log the error and return zeros,
      // as the account existence is already confirmed by getAccountsByPublicKey
      log("concordium-sync", `Error fetching balance for account with address ${account.address}`, {
        error,
      });

      return { finalizedBalance: { accountAmount: "0", accountAtDisposal: "0" } };
    });

    balance = valueToBigNumber(accountAmount);

    const minReserve = coinConfig.getCoinConfig(currency).minReserve;
    spendableBalance = accountAtDisposal
      ? valueToBigNumber(accountAtDisposal)
      : balance.minus(minReserve);
    spendableBalance = spendableBalance.isNegative() ? new BigNumber(0) : spendableBalance;

    const oldOperations = initialAccount?.operations ?? [];

    const proxyOperations = await getOperations(currency, account.address, accountId, {
      size: 100,
    }).catch((error): ProxyOperation[] => {
      // If operations request fails, log the error and return an empty array,
      // to avoid blocking the account sync, as we can still show the balance and other details
      log(
        "concordium-sync",
        `Error fetching operations for account with address ${account.address}`,
        { error },
      );

      return [];
    });

    const newOperations = proxyOperations.map(proxyOperationToLiveOperation);
    const operations = mergeOps(oldOperations, newOperations);

    return {
      balance,
      blockHeight: operations[0]?.blockHeight ?? 0,
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
