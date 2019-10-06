// @flow

import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency, DerivationMode, Account } from "../../types";
import type { CoreCurrency } from "../../libcore/types";
import type { CoreRippleLikeTransaction } from "./types";

export async function rippleSignTransaction({
  account,
  transport,
  coreTransaction
}: {
  isCancelled: () => boolean,
  account: Account,
  transport: Transport<*>,
  currency: CryptoCurrency,
  coreCurrency: CoreCurrency,
  coreTransaction: CoreRippleLikeTransaction,
  derivationMode: DerivationMode
}) {
  const hwApp = new Xrp(transport);
  const result = await hwApp.signTransaction(
    account.freshAddressPath,
    await coreTransaction.serialize()
  );

  await coreTransaction.setDERSignature(result);

  const raw = await coreTransaction.serialize();
  return raw;
}

export default rippleSignTransaction;
