// @flow
// TODO split in files!!!

import {
  isSegwitDerivationMode,
  getDerivationScheme,
} from "@ledgerhq/live-common/lib/derivation";
import {
  encodeAccountId,
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  getWalletName,
} from "@ledgerhq/live-common/lib/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import type {
  Account,
  AccountRaw,
  CryptoCurrency,
} from "@ledgerhq/live-common/lib/types";
import load from "./load";
import {
  getValue,
  getBlockHeightForAccount,
  getOperationDate,
  createInstance,
  OperationTypeMap,
} from "./specific";
import accountModel from "../logic/accountModel";
import { InvalidRecipient } from "../errors";

async function getOrCreateWallet({
  core,
  walletName,
  currency,
  derivationMode,
}: {
  core: *,
  walletName: string,
  currency: CryptoCurrency,
  derivationMode: string,
}) {
  const poolInstance = core.getPoolInstance();
  let wallet;
  try {
    wallet = await core.coreWalletPool.getWallet(poolInstance, walletName);
  } catch (err) {
    const currencyCore = await core.coreWalletPool.getCurrency(
      poolInstance,
      currency.id,
    );
    const config = await core.coreDynamicObject.newInstance();

    const derivationScheme = getDerivationScheme({ currency, derivationMode });

    if (isSegwitDerivationMode(derivationMode)) {
      core.coreDynamicObject.putString(config, "KEYCHAIN_ENGINE", "BIP49_P2SH");
    }
    core.coreDynamicObject.putString(
      config,
      "KEYCHAIN_DERIVATION_SCHEME",
      derivationScheme,
    );

    wallet = await core.coreWalletPool.createWallet(
      poolInstance,
      walletName,
      currencyCore,
      config,
    );
  }
  return wallet;
}

export async function syncAccount({ account }: { account: Account }) {
  const { derivationMode, currency, xpub, index, seedIdentifier } = account;
  const core = await load();
  const walletName = getWalletName(account);

  const coreWallet = await getOrCreateWallet({
    core,
    walletName,
    currency,
    derivationMode,
  });

  const coreAccount = await getOrCreateAccount({
    core,
    coreWallet,
    index,
    xpub,
  });

  const updatedAccount = await syncCoreAccount({
    core,
    coreWallet,
    coreAccount,
    walletName,
    currencyId: currency.id,
    accountIndex: account.index,
    derivationMode,
    seedIdentifier,
  });

  return updatedAccount;
}

async function getOrCreateAccount({ core, coreWallet, xpub, index }) {
  let coreAccount;
  try {
    coreAccount = await core.coreWallet.getAccount(coreWallet, index);
  } catch (err) {
    const extendedInfos = await core.coreWallet.getExtendedKeyAccountCreationInfo(
      coreWallet,
      index,
    );

    const infosIndex = getValue(
      await core.coreExtendedKeyAccountCreationInfo.getIndex(extendedInfos),
    );
    const extendedKeys = getValue(
      await core.coreExtendedKeyAccountCreationInfo.getExtendedKeys(
        extendedInfos,
      ),
    );
    const owners = getValue(
      await core.coreExtendedKeyAccountCreationInfo.getOwners(extendedInfos),
    );
    const derivations = getValue(
      await core.coreExtendedKeyAccountCreationInfo.getDerivations(
        extendedInfos,
      ),
    );

    extendedKeys.push(xpub);

    const newExtendedKeys = await core.coreExtendedKeyAccountCreationInfo.init(
      infosIndex,
      owners,
      derivations,
      extendedKeys,
    );

    coreAccount = await core.coreWallet.newAccountWithExtendedKeyInfo(
      coreWallet,
      newExtendedKeys,
    );
  }
  return coreAccount;
}

export async function syncCoreAccount({
  core,
  coreWallet,
  coreAccount,
  currencyId,
  accountIndex,
  derivationMode,
  seedIdentifier,
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  walletName: string,
  currencyId: string,
  accountIndex: number,
  derivationMode: string,
  seedIdentifier: string,
}) {
  const eventReceiver = await createInstance(core.coreEventReceiver);
  const eventBus = await core.coreAccount.synchronize(coreAccount);
  const serialContext = await core.coreThreadDispatcher.getSerialExecutionContext(
    core.getThreadDispatcher(),
    "main",
  );
  await core.coreEventBus.subscribe(eventBus, serialContext, eventReceiver);

  const query = await core.coreAccount.queryOperations(coreAccount);
  const completedQuery = await core.coreOperationQuery.complete(query);
  const coreOperations = await core.coreOperationQuery.execute(completedQuery);
  const rawAccount = await buildAccountRaw({
    core,
    coreWallet,
    coreAccount,
    coreOperations,
    currencyId,
    accountIndex,
    derivationMode,
    seedIdentifier,
  });

  await core.flush();

  return accountModel.decode({ data: rawAccount, version: 0 });
}

// TODO get read of the "AccountRaw" abstraction
async function buildAccountRaw({
  core,
  coreWallet,
  coreAccount,
  coreOperations,
  currencyId,
  accountIndex,
  derivationMode,
  seedIdentifier,
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  coreOperations: *,
  currencyId: string,
  accountIndex: number,
  derivationMode: string,
  seedIdentifier: string,
}) {
  const nativeBalance = await core.coreAccount.getBalance(coreAccount);

  const { value: balance } = await core.coreAmount.toLong(nativeBalance);

  const currency = getCryptoCurrencyById(currencyId);

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
      buildOperationRaw({
        core,
        coreOperation,
        accountId: id,
      }),
    ),
  );

  const raw: $Exact<AccountRaw> = {
    id,
    xpub,
    derivationMode,
    seedIdentifier,
    name,
    freshAddress: freshAddress.str,
    freshAddressPath: freshAddress.path,
    balance,
    blockHeight,
    index: accountIndex,
    operations,
    pendingOperations: [],
    currencyId,
    unitMagnitude: currency.units[0].magnitude,
    lastSyncDate: new Date().toISOString(),
  };

  return raw;
}

// TODO get read of the "OperationRaw" abstraction (directly generate Operation)
async function buildOperationRaw({
  core,
  coreOperation,
  accountId,
}: {
  core: *,
  coreOperation: *,
  accountId: string,
}) {
  // FIXME lot of async stuff could be done in parallel. [a,b]=await Promise.all(...)

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
  const { value } = await core.coreAmount.toLong(coreValue);

  const coreFee = await core.coreOperation.getFees(coreOperation);
  const { value: fee } = await core.coreAmount.toLong(coreFee);

  const { value: blockHeight } = await core.coreOperation.getBlockHeight(
    coreOperation,
  );

  const [{ value: recipients }, { value: senders }] = await Promise.all([
    core.coreOperation.getRecipients(coreOperation),
    core.coreOperation.getSenders(coreOperation),
  ]);

  const date = await getOperationDate(core, coreOperation);

  const type = OperationTypeMap[operationType];

  const id = `${accountId}-${hash}-${type}`;

  return {
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
    date: date.toISOString(),
  };
}

export async function isValidRecipient({
  currency,
  recipient,
}: {
  currency: CryptoCurrency,
  recipient: string,
}): Promise<?Error> {
  const core = await load();
  const poolInstance = core.getPoolInstance();
  const currencyCore = await core.coreWalletPool.getCurrency(
    poolInstance,
    currency.id,
  );
  const addr = core.coreAddress;
  const { value } = await addr.isValid(recipient, currencyCore);
  if (value) {
    return Promise.resolve(null);
  }

  return Promise.resolve(new InvalidRecipient());
}
