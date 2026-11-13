import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonContext } from "../config";
import { isPartyUsed, readPartyState, type ValidOperationInfo } from "../logic/partyState";
import { getLedgerEnd, getPartyById } from "../network/gateway";
import resolver from "../signer";
import { CantonAccount, CantonResources, CantonSigner } from "../types";
import { buildSubAccounts } from "./buildSubAccounts";
import { getCurrencyContext } from "./context";
import { isAccountOnboarded } from "./onboard";
import { determineOperationType } from "./operationType";

const txInfoToOperationAdapter =
  (accountId: string, partyId: string) =>
  (txInfo: ValidOperationInfo): Operation => {
    const {
      asset: { instrumentId, instrumentAdmin },
      transaction_hash,
      uid,
      block: { height, hash },
      senders,
      recipients,
      transaction_timestamp,
      fee: { value: fee },
      transfers: [{ value: transferValue, details }],
    } = txInfo;

    const type = determineOperationType(
      details?.operationType,
      txInfo.type,
      transferValue,
      senders,
      partyId,
    );

    let value = new BigNumber(transferValue);

    if (type === "OUT" || type === "FEES") {
      value = value.plus(fee);
    }

    const feeValue = new BigNumber(fee);
    const memo = details?.metadata?.reason;

    const op: Operation = {
      id: encodeOperationId(accountId, transaction_hash, type),
      hash: transaction_hash,
      accountId,
      type,
      value,
      fee: feeValue,
      blockHash: hash ?? "",
      blockHeight: height,
      senders,
      recipients,
      date: new Date(transaction_timestamp),
      transactionSequenceNumber: new BigNumber(height),
      extra: {
        uid,
        memo,
        instrumentId,
        instrumentAdmin,
      },
    };

    return op;
  };

/** The sync's read of a party: its chain state, as legacy operations and token accounts. */
async function readPartyAccount(
  context: CantonContext,
  currencyId: string,
  partyId: string,
  { accountId, initialAccount }: { accountId: string; initialAccount: CantonAccount | undefined },
) {
  const { nativeInstrumentId } = await context.config();
  const oldOperations = initialAccount?.operations || [];
  const cursor = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
  const {
    totalBalance,
    spendableBalance,
    instrumentUtxoCounts,
    pendingTransferProposals,
    calTokens,
    operations: newOperations,
    tokenBalances,
  } = await readPartyState(context, currencyId, partyId, { cursor });

  const operations = partyId
    ? mergeOps(oldOperations, newOperations.map(txInfoToOperationAdapter(accountId, partyId)))
    : [];

  // Filter main account operations (native instrument only)
  const mainAccountOperations = operations.filter(op => {
    const extra = op.extra as { instrumentId?: string };
    return extra?.instrumentId === nativeInstrumentId;
  });

  // Build sub-accounts for tokens with their filtered operations
  const subAccounts = buildSubAccounts({
    accountId,
    tokenBalances,
    existingSubAccounts: initialAccount?.subAccounts ?? [],
    allOperations: operations,
    pendingTransferProposals,
    calTokens,
  });

  const used = isPartyUsed({
    nativeOperationsCount: mainAccountOperations.length,
    totalBalance,
    tokensCount: subAccounts.length,
    pendingTransferProposals,
  });

  return {
    totalBalance,
    spendableBalance,
    instrumentUtxoCounts,
    pendingTransferProposals,
    mainAccountOperations,
    subAccounts,
    used,
  };
}

export function makeGetAccountShape(
  signerContext: SignerContext<CantonSigner>,
  context: CantonContext,
): GetAccountShape<CantonAccount> {
  return async info => {
    const { address, currency, derivationMode, derivationPath, initialAccount } = info;
    const config = await context.config(currency.id);

    let isOnboarded = initialAccount?.cantonResources?.isOnboarded ?? false;
    let xpubOrAddress = (initialAccount?.xpub || initialAccount?.cantonResources?.xpub) ?? "";
    let publicKey: string | undefined = initialAccount?.cantonResources?.publicKey;

    if (!xpubOrAddress && !publicKey) {
      const getAddress = resolver(signerContext);
      const addressResult = await getAddress(info.deviceId ?? "", {
        path: derivationPath,
        currency: currency,
        derivationMode: derivationMode,
        verify: false,
      });
      publicKey = addressResult.publicKey;

      const result = await isAccountOnboarded(config, publicKey);
      isOnboarded = result.isOnboarded;

      if (isOnboarded && result.partyId) {
        xpubOrAddress = result.partyId;
      }
    }

    // Backfill publicKey for an already-onboarded account (xpub present but no
    // publicKey — e.g. synced before publicKey was captured). Deviceless: the
    // gateway party lookup returns it. Without publicKey, validateTopology can't
    // run and the topology-change prompt never shows. LIVE-34585
    if (xpubOrAddress && !publicKey) {
      const { public_key } = await getPartyById(config, xpubOrAddress);
      if (public_key) publicKey = public_key;
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: xpubOrAddress,
      derivationMode,
    });

    const {
      totalBalance,
      spendableBalance,
      instrumentUtxoCounts,
      pendingTransferProposals,
      mainAccountOperations,
      subAccounts,
      used,
    } = await readPartyAccount(getCurrencyContext(context, currency), currency.id, xpubOrAddress, {
      accountId,
      initialAccount,
    });

    const cantonResources: CantonResources = {
      isOnboarded,
      instrumentUtxoCounts,
      pendingTransferProposals,
      ...(publicKey ? { publicKey } : {}),
      xpub: xpubOrAddress,
    };

    const blockHeight = await getLedgerEnd(config);

    const creationDate =
      mainAccountOperations.length > 0
        ? new Date(Math.min(...mainAccountOperations.map(op => op.date.getTime())))
        : new Date();

    const shape = {
      id: accountId,
      type: "Account" as const,
      balance: totalBalance,
      blockHeight,
      creationDate,
      lastSyncDate: new Date(),
      freshAddress: address,
      seedIdentifier: address,
      operations: mainAccountOperations,
      operationsCount: mainAccountOperations.length,
      spendableBalance,
      subAccounts,
      xpub: xpubOrAddress,
      used,
      cantonResources,
    };

    return shape;
  };
}
