import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  type GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { KaspaAccount } from "../types/bridge";
import { BigNumber } from "bignumber.js";
import KaspaBIP32 from "../lib/bip32";

export const getAccountShape: GetAccountShape<KaspaAccount> = async info => {
  const { index, address, initialAccount } = info;

  // @ts-ignore
  const xpub = initialAccount.xpub || "";

  // console.log("XPUB", address);
  // console.log("a", info);

  // // Needed for incremental synchronisation
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "kaspa",
    xpubOrAddress: address,
    derivationMode: "",
  });

  // what is the format xpub exactly?
  const kaspaBip32: KaspaBIP32 = new KaspaBIP32(
    Buffer.from(xpub.slice(0, 66), "hex"),
    Buffer.from(xpub.slice(66), "hex"),
  );

  const accountAddresses: string[] = [];

  for (let type = 0; type < 1; type++) {
    for (let index = 0; index < 100; index++) {
      accountAddresses.push(kaspaBip32.getAddress(type, index));
    }
  }

  console.log(accountAddresses);
  //
  const oldOperations = initialAccount?.operations || [];
  //
  //
  // // get the current account balance state depending your api implementation
  const { blockHeight, balance, additionalBalance, nonce } = {
    blockHeight: 42,
    balance: 1234.0,
    additionalBalance: 0,
    nonce: 0,
  };
  //
  // // Merge new operations with the previously synced ones
  const newOperations = initialAccount?.operations || [];
  const operations = mergeOps(oldOperations, newOperations);

  return {
    id: accountId,
    xpub: xpub,
    blockHeight: 0,
    balance: BigNumber(0),
    spendableBalance: BigNumber(0),
    operations,
    operationsCount: 0,
  };
};

export const sync = makeSync({ getAccountShape });
