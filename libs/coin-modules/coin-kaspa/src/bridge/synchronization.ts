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

  // @ts-ignore
  const xpub =
    initialAccount?.xpub ||
    "410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563";
  // TODO: remove this test xpub before review

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
    spendableBalance: accountAddresses.totalBalance,
    operations,
    operationsCount: operations.length,
  };
};

export const sync = makeSync({ getAccountShape });
