import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  type GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { KaspaAccount } from "../types/bridge";
import { parseExtendedPublicKey } from "../lib/kaspa-util";
import { AccountAddresses, scanAddresses } from "../network";

export const getAccountShape: GetAccountShape<KaspaAccount> = async info => {
  const { initialAccount } = info;

  const xpub = initialAccount?.xpub;

  if (!xpub) {
    throw new Error("xpub is empty");
  }

  // // Needed for incremental synchronisation
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "kaspa",
    xpubOrAddress: xpub,
    derivationMode: "",
  });

  const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(xpub, "hex"));
  // console.log(compressedPublicKey)

  const accountAddresses: AccountAddresses = await scanAddresses(compressedPublicKey, chainCode, 0);

  const oldOperations = initialAccount?.operations || [];
  //
  // // Merge new operations with the previously synced ones
  const newOperations = initialAccount?.operations || [];
  const operations = mergeOps(oldOperations, newOperations);

  // assume spendableBalance is balance as there is no significant time you need to wait for

  return {
    id: accountId,
    xpub: xpub,
    blockHeight: 0, // this doesn't really make sense in Kaspa
    balance: accountAddresses.totalBalance,
    spendableBalance: accountAddresses.spendableBalance,
    operations,
    operationsCount: operations.length,
    nextChangeAddressIndex: accountAddresses.nextChangeAddress.index,
    nextChangeAddressType: accountAddresses.nextChangeAddress.type,
    nextChangeAddress: accountAddresses.nextChangeAddress.address,
    nextReceiveAddressIndex: accountAddresses.nextReceiveAddress.index,
    nextReceiveAddressType: accountAddresses.nextReceiveAddress.type,
    nextReceiveAddress: accountAddresses.nextReceiveAddress.address,
  };
};

export const sync = makeSync({ getAccountShape });
