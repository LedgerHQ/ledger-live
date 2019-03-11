// @flow

import isEqual from "lodash/isEqual";
import {
  encodeAccountId,
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
} from "@ledgerhq/live-common/lib/account";
import type {
  Account,
  Operation,
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import {
  getValue,
  getBlockHeightForAccount,
  getOperationDate,
} from "./specific";
import { libcoreAmountToBigNumber } from "./buildBigNumber";

const OperationTypeMap = {
  "0": "OUT",
  "1": "IN",
};

const sameImmutableOp = (a: Operation, b: Operation) =>
  a === b ||
  (a.id === b.id && // hash, accountId, type are in id
    a.date.getTime() === b.date.getTime() &&
    (a.fee ? a.fee.isEqualTo(b.fee) : a.fee === b.fee) &&
    (a.value ? a.value.isEqualTo(b.value) : a.value === b.value) &&
    isEqual(a.senders, b.senders) &&
    isEqual(a.recipients, b.recipients));

function findExistingOp(ops, op) {
  return ops.find(o => o.id === op.id);
}

export async function buildAccount({
  core,
  coreWallet,
  coreAccount,
  coreOperations,
  currency,
  accountIndex,
  derivationMode,
  seedIdentifier,
  existingOperations,
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  coreOperations: *,
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
  existingOperations: Operation[],
}) {
  const nativeBalance = await core.coreAccount.getBalance(coreAccount);

  const balance = await libcoreAmountToBigNumber(core, nativeBalance);

  const coreAccountCreationInfo = await core.coreWallet.getAccountCreationInfo(
    coreWallet,
    accountIndex,
  );

  const derivations = getValue(
    await core.coreAccountCreationInfo.getDerivations(coreAccountCreationInfo),
  );

  const [, accountPath] = derivations;

  const blockHeight = await getBlockHeightForAccount(core, coreAccount);

  const [coreFreshAddress] = await core.coreAccount.getFreshPublicAddresses(
    coreAccount,
  );
  const [
    { value: freshAddressStr },
    { value: freshAddressPath },
  ] = await Promise.all([
    core.coreAddress.toString(coreFreshAddress),
    core.coreAddress.getDerivationPath(coreFreshAddress),
  ]);
  const freshAddress = {
    str: freshAddressStr,
    path: `${accountPath}/${freshAddressPath}`,
  };

  const name =
    coreOperations.length === 0
      ? getNewAccountPlaceholderName({
          currency,
          index: accountIndex,
          derivationMode,
        })
      : getAccountPlaceholderName({
          currency,
          index: accountIndex,
          derivationMode,
        });

  // retrieve xpub
  const { value: xpub } = await core.coreAccount.getRestoreKey(coreAccount);

  const accountId = encodeAccountId({
    type: "libcore",
    version: "1",
    currencyId: currency.id,
    xpubOrAddress: xpub,
    derivationMode,
  });

  // build operations with the minimal diff & call to libcore possible
  let operations = [];
  let existingOps = existingOperations;

  let immutableOpCmpDoneOnce = false;
  for (let i = coreOperations.length - 1; i >= 0; i--) {
    const coreOperation = coreOperations[i];
    const newOp = await buildOperation({
      core,
      coreOperation,
      accountId,
    });
    const existingOp = findExistingOp(existingOps, newOp);

    if (existingOp && !immutableOpCmpDoneOnce) {
      // an Operation is supposely immutable.
      if (existingOp.blockHeight !== newOp.blockHeight) {
        // except for blockHeight that can temporarily be null
        operations.push(newOp);
        continue; // eslint-disable-line no-continue
      } else {
        immutableOpCmpDoneOnce = true;
        // we still check the first existing op we meet...
        if (!sameImmutableOp(existingOp, newOp)) {
          // this implement a failsafe in case an op changes (when we fix bugs)
          // tradeoff: in such case, we assume all existingOps are to trash
          console.warn("op mismatch. doing a full clear cache.");
          existingOps = [];
          operations.push(newOp);
          continue; // eslint-disable-line no-continue
        }
      }
    }

    if (existingOp) {
      // as soon as we've found a first matching op in old op list,
      const j = existingOps.indexOf(existingOp);
      const rest = existingOps.slice(j);
      if (rest.length !== i + 1) {
        // if libcore happen to have different number of ops that what we have,
        // we actualy need to continue because we don't know where hole will be,
        // but we can keep existingOp
        operations.push(existingOp);
      } else {
        // otherwise we stop the libcore iteration and continue with previous data
        // and we're done on the iteration
        if (operations.length === 0 && j === 0) {
          // special case: we preserve the operations array as much as possible
          operations = existingOps;
        } else {
          operations = operations.concat(rest);
        }
        break;
      }
    } else {
      // otherwise it's a new op
      operations.push(newOp);
    }
  }

  const raw: $Exact<Account> = {
    id: accountId,
    seedIdentifier,
    xpub,
    derivationMode,
    index: accountIndex,
    freshAddress: freshAddress.str,
    freshAddressPath: freshAddress.path,
    name,
    balance,
    blockHeight,
    currency,
    unit: currency.units[0],
    operations,
    pendingOperations: [],
    lastSyncDate: new Date(),
  };

  return raw;
}

export async function buildOperation({
  core,
  coreOperation,
  accountId,
}: {
  core: *,
  coreOperation: *,
  accountId: string,
}) {
  const bitcoinLikeOperation = await core.coreOperation.asBitcoinLikeOperation(
    coreOperation,
  );
  const bitcoinLikeTransaction = await core.coreBitcoinLikeOperation.getTransaction(
    bitcoinLikeOperation,
  );
  const { value: hash } = await core.coreBitcoinLikeTransaction.getHash(
    bitcoinLikeTransaction,
  );
  const { value: operationType } = await core.coreOperation.getOperationType(
    coreOperation,
  );
  const type = OperationTypeMap[operationType];
  const id = `${accountId}-${hash}-${type}`;

  const coreValue = await core.coreOperation.getAmount(coreOperation);
  let value = await libcoreAmountToBigNumber(core, coreValue);

  const coreFee = await core.coreOperation.getFees(coreOperation);
  const fee = await libcoreAmountToBigNumber(core, coreFee);

  if (type === "OUT") {
    value = value.plus(fee);
  }

  // if tx is pending, libcore returns null (not wrapped with `value`)
  const blockHeightRes = await core.coreOperation.getBlockHeight(coreOperation);
  const blockHeight = blockHeightRes ? blockHeightRes.value : null;

  const [{ value: recipients }, { value: senders }] = await Promise.all([
    core.coreOperation.getRecipients(coreOperation),
    core.coreOperation.getSenders(coreOperation),
  ]);

  const date = await getOperationDate(core, coreOperation);

  const op: $Exact<Operation> = {
    id,
    hash,
    type,
    value,
    fee,
    senders,
    recipients,
    blockHeight,
    blockHash: null, // FIXME: why? (unused)
    accountId,
    date,
    extra: {},
  };

  return op;
}
