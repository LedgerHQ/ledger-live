import { Account } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "../converters";
import { isAccount } from "../../account/index";
import { getWalletAccount } from "@ledgerhq/coin-bitcoin/getWalletAccount";
import { WalletAPIContext } from "./context";

type WalletAccount = ReturnType<typeof getWalletAccount>;
type WalletXpub = WalletAccount["xpub"];
type WalletAddress = Awaited<ReturnType<WalletXpub["getXpubAddresses"]>>[number];

export const bitcoinFamilyAccountGetAddressLogic = (
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  derivationPath?: string,
): Promise<string> => {
  tracking.bitcoinFamilyAccountAddressRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.bitcoinFamilyAccountAddressFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.bitcoinFamilyAccountAddressFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  if (!isAccount(account) || account.currency.family !== "bitcoin") {
    tracking.bitcoinFamilyAccountAddressFail(manifest);
    return Promise.reject(new Error("account requested is not a bitcoin family account"));
  }

  if (derivationPath) {
    const path = derivationPath.split("/");
    const accountNumber = Number(path[0]);
    const index = Number(path[1]);

    if (Number.isNaN(accountNumber) || Number.isNaN(index)) {
      tracking.bitcoinFamilyAccountAddressFail(manifest);
      return Promise.reject(new Error("Invalid derivationPath"));
    }

    const walletAccount = getWalletAccount(account);
    const address = walletAccount.xpub.crypto.getAddress(
      walletAccount.xpub.derivationMode,
      walletAccount.xpub.xpub,
      accountNumber,
      index,
    );
    tracking.bitcoinFamilyAccountAddressSuccess(manifest);
    return Promise.resolve(address);
  }

  tracking.bitcoinFamilyAccountAddressSuccess(manifest);
  return Promise.resolve(account.freshAddress);
};

function getRelativePath(path: string) {
  const splitPath = path.split("'/");
  return splitPath.at(-1) ?? "";
}

export const bitcoinFamilyAccountGetPublicKeyLogic = async (
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  derivationPath?: string,
): Promise<string> => {
  tracking.bitcoinFamilyAccountPublicKeyRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.bitcoinFamilyAccountPublicKeyFail(manifest);
    throw new Error(`accountId ${walletAccountId} unknown`);
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.bitcoinFamilyAccountPublicKeyFail(manifest);
    throw new Error("account not found");
  }

  if (!isAccount(account) || account.currency.family !== "bitcoin") {
    tracking.bitcoinFamilyAccountPublicKeyFail(manifest);
    throw new Error("account requested is not a bitcoin family account");
  }

  const path = derivationPath?.split("/") ?? getRelativePath(account.freshAddressPath).split("/");
  const accountNumber = Number(path[0]);
  const index = Number(path[1]);

  if (Number.isNaN(accountNumber) || Number.isNaN(index)) {
    tracking.bitcoinFamilyAccountPublicKeyFail(manifest);
    throw new Error("Invalid derivationPath");
  }

  const walletAccount = getWalletAccount(account);
  const publicKey = await walletAccount.xpub.crypto.getPubkeyAt(
    walletAccount.xpub.xpub,
    accountNumber,
    index,
  );
  tracking.bitcoinFamilyAccountPublicKeySuccess(manifest);
  return publicKey.toString("hex");
};

export const bitcoinFamilyAccountGetXPubLogic = (
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
): Promise<string> => {
  tracking.bitcoinFamilyAccountXpubRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.bitcoinFamilyAccountXpubFail(manifest);
    return Promise.reject(new Error(`accountId ${walletAccountId} unknown`));
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.bitcoinFamilyAccountXpubFail(manifest);
    return Promise.reject(new Error("account not found"));
  }

  if (!isAccount(account) || account.currency.family !== "bitcoin") {
    tracking.bitcoinFamilyAccountXpubFail(manifest);
    return Promise.reject(new Error("account requested is not a bitcoin family account"));
  }

  if (!account.xpub) {
    tracking.bitcoinFamilyAccountXpubFail(manifest);
    return Promise.reject(new Error("account xpub not available"));
  }

  tracking.bitcoinFamilyAccountXpubSuccess(manifest);
  return Promise.resolve(account.xpub);
};

export interface BitcoinGetAddressesResultItem {
  address: string;
  publicKey?: string;
  path?: string;
  intention?: string;
}

const PAYMENT_INTENTION = "payment";

function assertBitcoinAccount(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
): Account {
  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.bitcoinFamilyAccountAddressesFail(manifest);
    throw new Error(`accountId ${walletAccountId} unknown`);
  }

  const account = accounts.find(a => a.id === accountId);
  if (account === undefined) {
    tracking.bitcoinFamilyAccountAddressesFail(manifest);
    throw new Error("account not found");
  }

  if (!isAccount(account) || account.currency.family !== "bitcoin") {
    tracking.bitcoinFamilyAccountAddressesFail(manifest);
    throw new Error("account requested is not a bitcoin family account");
  }

  return account;
}

type AddressIndices = {
  receiveIndicesToInclude: Set<number>;
  changeIndicesToInclude: Set<number>;
};

function collectAddressIndices(allAddresses: WalletAddress[], xpub: WalletXpub): AddressIndices {
  let maxReceiveIndex = 0;
  let maxChangeIndex = 0;
  const receiveIndicesToInclude = new Set<number>([0]);
  const changeIndicesToInclude = new Set<number>();

  for (const a of allAddresses) {
    const hasUtxo = xpub.storage.getAddressUnspentUtxos(a).length > 0;
    if (a.account === 0) {
      if (a.index > maxReceiveIndex) maxReceiveIndex = a.index;
      if (hasUtxo) receiveIndicesToInclude.add(a.index);
    } else if (a.account === 1) {
      if (a.index > maxChangeIndex) maxChangeIndex = a.index;
      if (hasUtxo) changeIndicesToInclude.add(a.index);
    }
  }

  receiveIndicesToInclude.add(maxReceiveIndex + 1);
  receiveIndicesToInclude.add(maxReceiveIndex + 2);
  changeIndicesToInclude.add(maxChangeIndex + 1);
  changeIndicesToInclude.add(maxChangeIndex + 2);

  return { receiveIndicesToInclude, changeIndicesToInclude };
}

export const bitcoinFamilyAccountGetAddressesLogic = async (
  context: WalletAPIContext,
  walletAccountId: string,
  intentions?: string[],
): Promise<BitcoinGetAddressesResultItem[]> => {
  const { manifest, tracking } = context;
  tracking.bitcoinFamilyAccountAddressesRequested(manifest);

  const account = assertBitcoinAccount(context, walletAccountId);

  if (
    intentions !== undefined &&
    intentions.length > 0 &&
    !intentions.includes(PAYMENT_INTENTION)
  ) {
    tracking.bitcoinFamilyAccountAddressesSuccess(manifest);
    return [];
  }

  try {
    const walletAccount = getWalletAccount(account);
    const { xpub } = walletAccount;
    const { path: rootPath, index: accountIndex } = walletAccount.params;

    const allAddresses = await xpub.getXpubAddresses();

    const { receiveIndicesToInclude, changeIndicesToInclude } = collectAddressIndices(
      allAddresses,
      xpub,
    );

    const buildPath = (addressAccount: number, addressIndex: number): string =>
      `m/${rootPath}/${accountIndex}'/${addressAccount}/${addressIndex}`;

    const toInclude: Array<{ account: number; index: number }> = [];
    receiveIndicesToInclude.forEach(index => toInclude.push({ account: 0, index }));
    changeIndicesToInclude.forEach(index => toInclude.push({ account: 1, index }));

    const storedAddressByAccountIndex = new Map<string, string>();
    for (const a of allAddresses) {
      storedAddressByAccountIndex.set(`${a.account}:${a.index}`, a.address);
    }

    const addressPromises = toInclude.map(({ account: addrAccount, index: addrIndex }) => {
      const key = `${addrAccount}:${addrIndex}`;
      const cached = storedAddressByAccountIndex.get(key);
      return cached === undefined
        ? xpub.crypto.getAddress(xpub.derivationMode, xpub.xpub, addrAccount, addrIndex)
        : Promise.resolve(cached);
    });
    const publicKeyPromises = toInclude.map(({ account: addrAccount, index: addrIndex }) =>
      xpub.crypto.getPubkeyAt(xpub.xpub, addrAccount, addrIndex),
    );

    const [addressStrs, publicKeys] = await Promise.all([
      Promise.all(addressPromises),
      Promise.all(publicKeyPromises),
    ]);

    const result: BitcoinGetAddressesResultItem[] = toInclude.map(
      ({ account: addrAccount, index: addrIndex }, i) => ({
        address: addressStrs[i],
        publicKey: publicKeys[i].toString("hex"),
        path: buildPath(addrAccount, addrIndex),
        intention: PAYMENT_INTENTION,
      }),
    );

    tracking.bitcoinFamilyAccountAddressesSuccess(manifest);
    return result;
  } catch (error) {
    tracking.bitcoinFamilyAccountAddressesFail(manifest);
    throw error;
  }
};
