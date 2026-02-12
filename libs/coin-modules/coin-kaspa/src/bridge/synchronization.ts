import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Operation } from "@ledgerhq/types-live";
import { parseExtendedPublicKey, scanAddresses, scanOperations } from "../logic";
import { getBlockDagInfo, getVirtualChainBlueScore } from "../network";
import { AccountAddresses, KaspaAccount } from "../types";

export const getAccountShape: GetAccountShape<KaspaAccount> = async info => {
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

  // Fetch new operations
  // Timestamp with 60s buffer to make sure there's no gap
  let scanOperationsAfter: number = 1; // begin with after=1 for correct TX fetching
  if (initialAccount?.lastSyncTimestamp) {
    // as older blocks with valid transactions can be added into the BlockDAG up to an hour later,
    // we have to set the rescan timestamp to around 2 hours earlier than the last tip's timestamp.
    scanOperationsAfter = initialAccount.lastSyncTimestamp - 60 * 60 * 2 * 1000; // milliseconds timestamp
    scanOperationsAfter = Math.max(scanOperationsAfter, 1); // actually it can't really be lower than 1.
  }

  const usedAddresses: string[] = [
    ...accountAddresses.usedReceiveAddresses
      .filter(addr => addr.timestamp! > scanOperationsAfter)
      .map(addr => addr.address),
    ...accountAddresses.usedChangeAddresses
      .filter(addr => addr.timestamp! > scanOperationsAfter)
      .map(addr => addr.address),
  ];

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
    lastSyncTimestamp: Number.parseInt((await getBlockDagInfo()).pastMedianTime || "1"),
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
