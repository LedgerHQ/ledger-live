import { ScanAccountEvent } from "@ledgerhq/types-live";
import {
  GetAccountShape,
  makeScanAccounts,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
// import { firstValueFrom, from, Observable } from "rxjs";
// import getAccountShape from "../synchronisation";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { AptosAccount, AptosSigner } from "../../types";
// import { GetAddressOptions } from "@ledgerhq/coin-framework/lib/derivation";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { txsToOps } from "../logic";
import { AptosAPI } from ".../../../../../ledger-live-common/src/families/aptos/api";
// import { Aptos } from "@aptos-labs/ts-sdk";
// import { GetAddressFn } from "@ledgerhq/coin-framework/lib/bridge/getAddressWrapper";
import { signerGetAddress } from "../../signer/getAddress";
import { Observable } from "rxjs";

export const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, derivationMode, currency } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const aptosClient = new AptosAPI(currency.id);
  const { balance, transactions, blockHeight } = await aptosClient.getAccountInfo(address, startAt);

  const oldOperations = initialAccount?.operations || [];
  const newOperations = txsToOps(info, accountId, transactions);
  const operations = mergeOps(oldOperations, newOperations);

  const shape: Partial<AptosAccount> = {
    type: "Account",
    id: accountId,
    // xpub,
    balance: balance,
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
    blockHeight,
    lastSyncDate: new Date(),
  };

  return shape;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function scanAccounts(
  signerContext: SignerContext<AptosSigner>,
): Observable<ScanAccountEvent> {
  const getAddress = signerGetAddress(signerContext);

  return makeScanAccounts({ getAccountShape, getAddressFn: getAddressWrapper(getAddress) });
}
