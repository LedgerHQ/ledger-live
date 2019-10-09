// @flow

import Xtz from "./hw-app-xtz";
import Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency, DerivationMode, Account } from "../../types";
import type { CoreCurrency } from "../../libcore/types";
import type { CoreTezosLikeTransaction } from "./types";

export async function tezosSignTransaction({
  account,
  transport,
  coreTransaction
}: {
  isCancelled: () => boolean,
  account: Account,
  transport: Transport<*>,
  currency: CryptoCurrency,
  coreCurrency: CoreCurrency,
  coreTransaction: CoreTezosLikeTransaction,
  derivationMode: DerivationMode
}) {
  const hwApp = new Xtz(transport);

  const { signature } = await hwApp.signOperation(
    account.freshAddressPath,
    await coreTransaction.serialize()
  );

  await coreTransaction.setSignature(signature);

  const raw = await coreTransaction.serialize();

  return raw;
}

export default tezosSignTransaction;
