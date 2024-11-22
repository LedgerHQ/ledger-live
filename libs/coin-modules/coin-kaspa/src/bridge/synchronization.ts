import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { type GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { KaspaAccount } from "../types/bridge";
import { parseExtendedPublicKey } from "../lib/kaspa-util";
import { AccountAddresses, scanAddresses, scanOperations } from "../network/index";
import { Operation } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { KaspaSigner } from "../signer";

export const makeGetAccountShape =
  (signerContext: SignerContext<KaspaSigner>): GetAccountShape<KaspaAccount> =>
  async info => {
    const { initialAccount, deviceId, derivationPath } = info;

    let xpub = initialAccount?.xpub;

    if (!xpub) {
      // CLI does not deliver account (44'/11111'/0') xpub - need to calculate it..
      const accountPath = derivationPath.split("/").slice(0, 3).join("/");
      xpub = (await signerContext(deviceId || "", signer => signer.getAddress(accountPath)))
        .publicKey;
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
    const allOperations: Operation[] = await scanOperations(usedAddresses);
    const operations = mergeOps(oldOperations, allOperations);

    console.log(`Total balance: ${accountAddresses.totalBalance.toNumber()}`);
    console.log(`Spendable balance: ${accountAddresses.spendableBalance.toNumber()}`);

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

// export const sync = makeSync({ getAccountShape });
