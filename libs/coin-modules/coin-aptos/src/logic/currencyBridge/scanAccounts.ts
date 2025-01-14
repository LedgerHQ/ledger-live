import { CurrencyBridge } from "@ledgerhq/types-live";
import {
  GetAccountShape,
  makeScanAccounts,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import { AptosAccount, AptosSigner } from "../../types";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { txsToOps } from "../logic";
import { signerGetAddress } from "../../signer/getAddress";
import getAddressWrapper from "@ledgerhq/coin-framework/lib/bridge/getAddressWrapper";
import { getAccountInfo } from "../getAccountInfo";
import BigNumber from "bignumber.js";

export const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, derivationMode, currency } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { balance, transactions, blockHeight } = await getAccountInfo(address, "0");

  const oldOperations = initialAccount?.operations || [];
  const newOperations = txsToOps(info, accountId, transactions);
  const operations = mergeOps(oldOperations, newOperations);

  const shape: Partial<AptosAccount> = {
    type: "Account",
    id: accountId,
    balance: BigNumber(balance.toString()),
    spendableBalance: BigNumber(balance.toString()),
    operations,
    operationsCount: operations.length,
    blockHeight,
    lastSyncDate: new Date(),
  };

  return shape;
};

export function scanAccounts(
  signerContext: SignerContext<AptosSigner>,
): CurrencyBridge["scanAccounts"] {
  const getAddress = signerGetAddress(signerContext);
  const getAddressFn = getAddressWrapper(getAddress);

  return makeScanAccounts({ getAccountShape, getAddressFn });
}
