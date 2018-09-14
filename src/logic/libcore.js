// @flow

import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/helpers/currencies";
import type { Account } from "@ledgerhq/live-common/lib/types";

import { splittedCurrencies } from "../config/cryptocurrencies";

import { accountModel } from "../reducers/accounts";
import getLibCore from "./getLibcore";
import * as accountIdHelper from "./accountId";
import { isSegwitPath, isUnsplitPath } from "./bip32";
import {
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
} from "./accountName";

// FIXME: is there a way to import from libcore?
const OperationTypeMap = {
  SEND: "OUT",
  RECEIVE: "IN",
};

type ScanOpts = {
  isSegwit: boolean,
  isUnsplit: boolean,
};

async function getOrCreateWallet({
  core,
  walletName,
  currencyId,
  opts: { isSegwit, isUnsplit },
}: {
  core: *,
  walletName: string,
  currencyId: string,
  opts: ScanOpts,
}) {
  const poolInstance = core.getPoolInstance();
  let wallet;
  try {
    wallet = await core.coreWalletPool.getWallet(poolInstance, walletName);
  } catch (err) {
    const currency = await core.coreWalletPool.getCurrency(
      poolInstance,
      currencyId,
    );
    const config = await core.coreDynamicObject.newInstance();
    const splitConfig = isUnsplit
      ? splittedCurrencies[currencyId] || null
      : null;
    const coinType = splitConfig ? splitConfig.coinType : "<coin_type>";
    if (isSegwit) {
      core.coreDynamicObject.putString(config, "KEYCHAIN_ENGINE", "BIP49_P2SH");
      core.coreDynamicObject.putString(
        config,
        "KEYCHAIN_DERIVATION_SCHEME",
        `49'/${coinType}'/<account>'/<node>/<address>`,
      );
    } else if (isUnsplit) {
      core.coreDynamicObject.putString(
        config,
        "KEYCHAIN_DERIVATION_SCHEME",
        `44'/${coinType}'/<account>'/<node>/<address>`,
      );
    }
    wallet = await core.coreWalletPool.createWallet(
      poolInstance,
      walletName,
      currency,
      config,
    );
  }
  return wallet;
}

export async function syncAccount({ account }: { account: Account }) {
  const core = await getLibCore();
  const decodedAccountId = accountIdHelper.decode(account.id);
  const { walletName } = decodedAccountId;

  const isSegwit = isSegwitPath(account.freshAddressPath);
  const isUnsplit = isUnsplitPath(
    account.freshAddressPath,
    splittedCurrencies[account.currency.id],
  );

  const opts = { isSegwit, isUnsplit };

  const coreWallet = await getOrCreateWallet({
    core,
    walletName,
    currencyId: account.currency.id,
    opts,
  });

  const coreAccount = await core.coreWallet.getAccount(
    coreWallet,
    account.index,
  );

  const updatedAccount = await syncCoreAccount({
    core,
    coreWallet,
    coreAccount,
    walletName,
    currencyId: account.currency.id,
    accountIndex: account.index,
    opts,
  });

  return updatedAccount;
}

export async function syncCoreAccount({
  core,
  coreWallet,
  coreAccount,
  walletName,
  currencyId,
  accountIndex,
  opts,
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  walletName: string,
  currencyId: string,
  accountIndex: number,
  opts: ScanOpts,
}) {
  const eventReceiver = await core.coreEventReceiver.newInstance();
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
    walletName,
    currencyId,
    accountIndex,
    opts,
  });

  await core.flush();

  return accountModel.decode({ data: rawAccount, version: 0 });
}

export async function getAccountFromXPUB({
  xpub,
  currencyId,
  opts = { isSegwit: true, isUnsplit: false },
}: {
  xpub: string,
  currencyId: string,
  opts: ScanOpts,
}) {
  let coreAccount;
  const index = 0;
  const core = await getLibCore();

  // TODO: real wallet name
  const walletName = `temporary-wallet-name-${Date.now()}`;

  const coreWallet = await getOrCreateWallet({
    core,
    walletName,
    currencyId,
    opts,
  });

  try {
    coreAccount = await core.coreWallet.getAccount(coreWallet, index);
  } catch (err) {
    const extendedInfos = await core.coreWallet.getExtendedKeyAccountCreationInfo(
      coreWallet,
      index,
    );
    const infosIndex = await core.coreExtendedKeyAccountCreationInfo.getIndex(
      extendedInfos,
    );
    const extendedKeys = await core.coreExtendedKeyAccountCreationInfo.getExtendedKeys(
      extendedInfos,
    );
    const owners = await core.coreExtendedKeyAccountCreationInfo.getOwners(
      extendedInfos,
    );
    const derivations = await core.coreExtendedKeyAccountCreationInfo.getDerivations(
      extendedInfos,
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

  const account = await syncCoreAccount({
    core,
    coreWallet,
    coreAccount,
    walletName,
    currencyId,
    accountIndex: index,
    opts,
  });

  return account;
}

async function buildAccountRaw({
  core,
  coreWallet,
  coreAccount,
  coreOperations,
  walletName,
  currencyId,
  accountIndex,
  opts: { isSegwit, isUnsplit },
}: {
  core: *,
  coreWallet: *,
  coreAccount: *,
  coreOperations: *,
  walletName: string,
  currencyId: string,
  accountIndex: number,
  opts: ScanOpts,
}) {
  const nativeBalance = await core.coreAccount.getBalance(coreAccount);
  const { value: balance } = await core.coreAmount.toLong(nativeBalance);

  const currency = getCryptoCurrencyById(currencyId);
  const coreAccountCreationInfo = await core.coreWallet.getAccountCreationInfo(
    coreWallet,
    accountIndex,
  );
  const derivations = await core.coreAccountCreationInfo.getDerivations(
    coreAccountCreationInfo,
  );
  const [walletPath, accountPath] = derivations;

  // FIXME: this is throwing
  //        `Cannot convert argument of type class java.lang.Long`
  //
  // const coreBlock = await core.coreAccount.getLastBlock(coreAccount)
  // const blockHeight = await core.coreBlock.getHeight(coreBlock)
  const blockHeight = 0;

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
      ? getNewAccountPlaceholderName(currency, accountIndex)
      : getAccountPlaceholderName(
          currency,
          accountIndex,
          (currency.supportsSegwit && !isSegwit) || false,
          isUnsplit,
        );

  // retrieve xpub
  const { value: xpub } = await core.coreAccount.getRestoreKey(coreAccount);

  // build operations
  const operations = await Promise.all(
    coreOperations.map(coreOperation =>
      buildOperationRaw({
        core,
        coreOperation,
        xpub,
      }),
    ),
  );

  return {
    id: accountIdHelper.encode({
      type: "libcore",
      version: "1",
      xpub,
      walletName,
    }),
    xpub,
    path: walletPath,
    name,
    isSegwit,
    freshAddress: freshAddress.str,
    freshAddressPath: freshAddress.path,
    balance,
    blockHeight,
    archived: false,
    index: accountIndex,
    operations,
    pendingOperations: [],
    currencyId,
    unitMagnitude: currency.units[0].magnitude,
    lastSyncDate: new Date().toISOString(),
  };
}

async function buildOperationRaw({
  core,
  coreOperation,
  xpub,
}: {
  core: *,
  coreOperation: *,
  xpub: string,
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
  const { value } = await core.coreAmount.toLong(coreValue);

  const coreFee = await core.coreOperation.getFees(coreOperation);
  const { value: fee } = await core.coreAmount.toLong(coreFee);

  const [{ value: recipients }, { value: senders }] = await Promise.all([
    core.coreOperation.getRecipients(coreOperation),
    core.coreOperation.getSenders(coreOperation),
  ]);

  // FIXME: libcore is sending date without timezone, and with weird
  //        format (e.g: `2018-59-31 03:59:53`)
  //
  // const { value: date } = await core.coreOperation.getDate(coreOperation);
  const date = new Date();

  // if transaction is a send, amount becomes negative
  const type = OperationTypeMap[operationType];

  const id = `${xpub}-${hash}-${type}`;

  return {
    id,
    hash,
    type,
    value,
    fee,
    senders,
    recipients,
    blockHeight: 0, // FIXME: fill it
    blockHash: null, // FIXME: why? (unused)
    accountId: xpub, // FIXME: iso as desktop, but looks wrong
    date: date.toISOString(), // FIXME: ensure that timezone is correct
  };
}
