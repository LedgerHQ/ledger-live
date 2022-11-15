import { GetAccountShape, mergeOps } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts } from "../../bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "../../account";
import Nervos from "@ledgerhq/hw-app-nervos";
import { NervosAccount } from "./types";
import Xpub from "./xpub";
import { getBalance, mapTxToOperations } from "./logic";
import { getCurrentBlockHeight } from "./api";

const getAccountShape: GetAccountShape = async (info) => {
  const {
    transport,
    currency,
    index,
    derivationPath,
    derivationMode,
    initialAccount,
  } = info;

  const rootPath = derivationPath.split("/", 2).join("/");
  const basePath = `${rootPath}/${index}'`;

  let [publicKey, chainCode] = initialAccount
    ? decodeAccountId(initialAccount.id).xpubOrAddress.split("_")
    : [undefined, undefined];

  if (!publicKey || !chainCode) {
    // Xpub not provided, generate it using the hwapp
    if (!transport) {
      // hwapp not provided
      throw new Error("hwapp required to generate the xpub");
    }
    const nervos = new Nervos(transport);
    const extendedPublicKey = await nervos.getExtendedPublicKey(basePath);
    publicKey = extendedPublicKey.publicKey;
    chainCode = extendedPublicKey.chainCode;
  }

  const xpubString = `${publicKey}_${chainCode}`;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: xpubString,
    derivationMode: derivationMode,
  });

  const xpub =
    (initialAccount as NervosAccount)?.nervosResources?.xpub ||
    new Xpub({ basePath, publicKey, chainCode });
  const oldOperations = initialAccount?.operations || [];

  const blockHeight = await getCurrentBlockHeight();
  await xpub.sync();

  const liveCells = xpub.getLiveCells();
  const balance = getBalance(liveCells);
  const freshReceiveAddress = xpub.getFreshReceiveAddress();
  const freshReceiveAddressPath = `${basePath}/0/${xpub.getFreshReceiveAddressIndex()}`;
  const freshChangeAddress = xpub.getFreshChangeAddress();
  const freshChangeAddressPath = `${basePath}/1/${xpub.getFreshChangeAddressIndex()}`;
  const { txs, previousTxHashToTx } = xpub.getTransactions();
  const { lockArgsReceive, lockArgsChange } = xpub.getLockArgs();
  const newOperations = txs
    .map((tx) =>
      mapTxToOperations(
        accountId,
        tx,
        previousTxHashToTx,
        lockArgsReceive,
        lockArgsChange
      )
    )
    .flat();
  const operations = mergeOps(oldOperations, newOperations);

  return {
    type: "Account",
    id: accountId,
    xpub: xpubString,
    balance,
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
    freshAddress: freshReceiveAddress,
    freshAddressPath: freshReceiveAddressPath,
    blockHeight,
    nervosResources: {
      xpub,
      freshChangeAddress: freshChangeAddress,
      freshChangeAddressPath: freshChangeAddressPath,
    },
  };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
