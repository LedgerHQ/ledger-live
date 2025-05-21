import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountAddresses, KaspaAccount } from "../types";
import { Operation } from "@ledgerhq/types-live";
import { parseExtendedPublicKey, scanAddresses, scanOperations } from "../logic";
import { getBlockDagInfo, getVirtualChainBlueScore } from "../network";

export const makeGetAccountShape = (): GetAccountShape<KaspaAccount> => async info => {
  const { initialAccount, index, rest } = info;

  const xpub =
    rest?.publicKey || (initialAccount && decodeAccountId(initialAccount.id).xpubOrAddress);

  // // Needed for incremental synchronisation
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "kaspa",
    xpubOrAddress: xpub,
    derivationMode: "",
  });

  const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(xpub, "hex"));

  const accountAddresses: AccountAddresses = await scanAddresses(compressedPublicKey, chainCode, 0);

  const oldOperations = initialAccount?.operations || [];
  //
  // // Merge new operations with the previously synced ones
  const usedAddresses: string[] = [
    ...accountAddresses.usedReceiveAddresses.map(addr => addr.address),
    ...accountAddresses.usedChangeAddresses.map(addr => addr.address),
  ];

  let scanOperationsAfter: number = 1; // begin with after=1 for correct TX fetching
  if (initialAccount?.lastSyncTimestamp) {
    // as older blocks with valid transactions can be added into the BlockDAG up to an hour later,
    // we have to set the rescan timestamp to around 2 hours earlier than the last tip's timestamp.
    scanOperationsAfter = Number(initialAccount.lastSyncTimestamp) - 60 * 60 * 2 * 1000; // milliseconds timestamp
    scanOperationsAfter = Math.max(scanOperationsAfter, 1); // actually it can't really be lower than 1.
  }

  const allOperations: Operation[] = await scanOperations(
    usedAddresses,
    accountId,
    scanOperationsAfter,
  );
  const operations = mergeOps(oldOperations, allOperations);

  const activeAddressCount: number =
    accountAddresses.usedReceiveAddresses.filter(address => address.balance.gt(0)).length +
    accountAddresses.usedChangeAddresses.filter(address => address.balance.gt(0)).length;

  return {
    id: accountId,
    xpub: xpub,
    lastSyncTimestamp: (await getBlockDagInfo()).pastMedianTime || "1",
    index,
    blockHeight: await getVirtualChainBlueScore(),
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
    activeAddressCount: activeAddressCount,
    freshAddress: accountAddresses.nextReceiveAddress.address,
    freshAddressPath: `44'/111111'/${index}'/${accountAddresses.nextReceiveAddress.type}/${accountAddresses.nextReceiveAddress.index}`,
    used: operations.length > 0,
  };
};
