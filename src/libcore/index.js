// @flow
// TODO split in files!!!
import { BigNumber } from "bignumber.js";
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
  Operation,
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import { InvalidAddress } from "@ledgerhq/live-common/lib/errors";
import load from "./load";
import {
  getValue,
  getBlockHeightForAccount,
  getOperationDate,
  createInstance,
} from "./specific";
import { atomicQueue } from "../logic/promise";
import { remapLibcoreErrors } from "./errors";

const OperationTypeMap = {
  "0": "OUT",
  "1": "IN",
};

export const getOrCreateWallet = atomicQueue(
  async ({
    core,
    walletName,
    currency,
    derivationMode,
  }: {
    core: *,
    walletName: string,
    currency: CryptoCurrency,
    derivationMode: DerivationMode,
  }) => {
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

      const derivationScheme = getDerivationScheme({
        currency,
        derivationMode,
      });

      if (isSegwitDerivationMode(derivationMode)) {
        core.coreDynamicObject.putString(
          config,
          "KEYCHAIN_ENGINE",
          "BIP49_P2SH",
        );
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
  },
  ({ walletName }) => walletName,
);

export async function bigNumberToLibcoreAmount(
  core: *,
  walletCurrency: *,
  amount: BigNumber,
) {
  return core.coreAmount.fromHex(walletCurrency, amount.toString(16));
}

export async function libcoreAmountToBigNumber(
  core: *,
  amountInstance: string,
): Promise<BigNumber> {
  const coreBigInt = await core.coreAmount.toBigInt(amountInstance);
  const { value } = await core.coreBigInt.toString(coreBigInt, 10);
  return BigNumber(value);
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

export async function createAccountFromDevice({
  core,
  wallet,
  hwApp,
}: {
  core: *,
  wallet: *,
  hwApp: *,
}) {
  const accountCreationInfos = await core.coreWallet.getNextAccountCreationInfo(
    wallet,
  );
  const chainCodes = getValue(
    await core.coreAccountCreationInfo.getChainCodes(accountCreationInfos),
  );
  const publicKeys = getValue(
    await core.coreAccountCreationInfo.getPublicKeys(accountCreationInfos),
  );
  const index = (await core.coreAccountCreationInfo.getIndex(
    accountCreationInfos,
  )).value;
  const derivations = getValue(
    await core.coreAccountCreationInfo.getDerivations(accountCreationInfos),
  );
  const owners = getValue(
    await core.coreAccountCreationInfo.getOwners(accountCreationInfos),
  );

  await derivations.reduce(
    (promise, derivation) =>
      promise.then(async () => {
        const { publicKey, chainCode } = await hwApp.getWalletPublicKey(
          derivation,
        );
        publicKeys.push(publicKey);
        chainCodes.push(chainCode);
      }),
    Promise.resolve(),
  );

  const newAccountCreationInfos = await core.coreAccountCreationInfo.init(
    index,
    owners,
    derivations,
    publicKeys,
    chainCodes,
  );

  return core.coreWallet.newAccountWithInfo(wallet, newAccountCreationInfos);
}

const getOrCreateAccount = atomicQueue(
  async ({ core, coreWallet, xpub, index }) => {
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
  },
  ({ xpub }) => xpub || "",
);

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
  currencyId: string,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
}): Promise<Account> {
  const eventReceiver = await createInstance(core.coreEventReceiver);
  const eventBus = await core.coreAccount.synchronize(coreAccount);
  const serialContext = await core.coreThreadDispatcher.getMainExecutionContext(
    core.getThreadDispatcher(),
  );
  await core.coreEventBus.subscribe(eventBus, serialContext, eventReceiver);

  const query = await core.coreAccount.queryOperations(coreAccount);
  const completedQuery = await core.coreOperationQuery.complete(query);
  const coreOperations = await core.coreOperationQuery.execute(completedQuery);
  const account = await buildAccount({
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

  return account;
}

async function buildAccount({
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
  derivationMode: DerivationMode,
  seedIdentifier: string,
}) {
  const nativeBalance = await core.coreAccount.getBalance(coreAccount);

  const balance = await libcoreAmountToBigNumber(core, nativeBalance);

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

async function buildOperation({
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

  return Promise.reject(
    new InvalidAddress(null, { currencyName: currency.name }),
  );
}

export async function getFeesForTransaction({
  account,
  transaction,
}: {
  account: Account,
  transaction: *,
}): Promise<BigNumber> {
  try {
    const { derivationMode, currency, xpub, index } = account;
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

    const bitcoinLikeAccount = await core.coreAccount.asBitcoinLikeAccount(
      coreAccount,
    );

    const walletCurrency = await core.coreWallet.getCurrency(coreWallet);

    const amount = await bigNumberToLibcoreAmount(
      core,
      walletCurrency,
      BigNumber(transaction.amount),
    );

    const feesPerByte = await bigNumberToLibcoreAmount(
      core,
      walletCurrency,
      BigNumber(transaction.feePerByte),
    );

    const transactionBuilder = await core.coreBitcoinLikeAccount.buildTransaction(
      bitcoinLikeAccount,
    );

    const isValid = await isValidRecipient({
      currency: account.currency,
      recipient: transaction.recipient,
    });

    if (isValid !== null) {
      throw new InvalidAddress("", { currencyName: currency.name });
    }

    await core.coreBitcoinLikeTransactionBuilder.sendToAddress(
      transactionBuilder,
      amount,
      transaction.recipient,
    );

    await core.coreBitcoinLikeTransactionBuilder.pickInputs(
      transactionBuilder,
      0,
      0xffffff,
    );

    await core.coreBitcoinLikeTransactionBuilder.setFeesPerByte(
      transactionBuilder,
      feesPerByte,
    );

    const builded = await core.coreBitcoinLikeTransactionBuilder.build(
      transactionBuilder,
    );
    const feesAmount = await core.coreBitcoinLikeTransaction.getFees(builded);
    const fees = await libcoreAmountToBigNumber(core, feesAmount);
    return fees;
  } catch (error) {
    throw remapLibcoreErrors(error);
  }
}
