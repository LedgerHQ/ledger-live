import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { type GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountAddresses, KaspaAccount } from "../types";
import { Operation } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { KaspaSigner } from "../signer";
import { parseExtendedPublicKey, scanAddresses, scanOperations } from "../logic";
import { getVirtualChainBlueScore } from "../network";

export const makeGetAccountShape =
  (signerContext: SignerContext<KaspaSigner>): GetAccountShape<KaspaAccount> =>
  async info => {
    const { initialAccount, deviceId, derivationPath } = info;

    let xpub = initialAccount?.xpub;
    let accountIndex: number = initialAccount?.index || 0;

    if (!xpub) {
      // CLI does not deliver account (44'/11111'/0') xpub - need to calculate it..
      const accountPath = derivationPath.split("/").slice(0, 3).join("/");
      xpub = (await signerContext(deviceId || "", signer => signer.getAddress(accountPath)))
        .publicKey;

      accountIndex = parseInt(derivationPath.split("/")[2].replace("'", ""), 10);
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

    const accountAddresses: AccountAddresses = await scanAddresses(
      compressedPublicKey,
      chainCode,
      0,
    );

    const oldOperations = initialAccount?.operations || [];
    //
    // // Merge new operations with the previously synced ones
    const usedAddresses: string[] = [
      ...accountAddresses.usedReceiveAddresses.map(addr => addr.address),
      ...accountAddresses.usedChangeAddresses.map(addr => addr.address),
    ];
    const allOperations: Operation[] = await scanOperations(usedAddresses, accountId);
    const operations = mergeOps(oldOperations, allOperations);

    const activeAddressCount: number =
      accountAddresses.usedReceiveAddresses.filter(address => address.balance.gt(0)).length +
      accountAddresses.usedChangeAddresses.filter(address => address.balance.gt(0)).length;

    return {
      id: accountId,
      xpub: xpub,
      index: accountIndex,
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
      freshAddressPath: `44'/111111'/${accountIndex}'/${accountAddresses.nextReceiveAddress.type}/${accountAddresses.nextReceiveAddress.index}`,
      used: operations.length > 0,
    };
  };
