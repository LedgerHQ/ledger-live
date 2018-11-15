// @flow

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

export async function buildAccount({
  core,
  coreWallet,
  coreAccount,
  coreOperations,
  currency,
  accountIndex,
  derivationMode,
  seedIdentifier,
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  coreOperations: *,
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
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

  const id = encodeAccountId({
    type: "libcore",
    version: "1",
    currencyId: currency.id,
    xpubOrAddress: xpub,
    derivationMode,
  });

  // build operations
  const operations = await Promise.all(
    coreOperations.map(coreOperation =>
      buildOperation({
        core,
        coreOperation,
        accountId: id,
      }),
    ),
  );

  const raw: $Exact<Account> = {
    id,
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

  const coreValue = await core.coreOperation.getAmount(coreOperation);
  const value = await libcoreAmountToBigNumber(core, coreValue);

  const coreFee = await core.coreOperation.getFees(coreOperation);
  const fee = await libcoreAmountToBigNumber(core, coreFee);

  // if tx is pending, libcore returns null (not wrapped with `value`)
  const blockHeightRes = await core.coreOperation.getBlockHeight(coreOperation);
  const blockHeight = blockHeightRes ? blockHeightRes.value : null;

  const [{ value: recipients }, { value: senders }] = await Promise.all([
    core.coreOperation.getRecipients(coreOperation),
    core.coreOperation.getSenders(coreOperation),
  ]);

  const date = await getOperationDate(core, coreOperation);

  const type = OperationTypeMap[operationType];

  const id = `${accountId}-${hash}-${type}`;

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
