// @flow

import invariant from "invariant";
import Eth from "@ledgerhq/hw-app-eth";
import Transport from "@ledgerhq/hw-transport";
import { byContractAddress } from "@ledgerhq/hw-app-eth/erc20";
import type { CryptoCurrency, Account } from "../../types";
import type { CoreCurrency } from "../../libcore/types";
import type { CoreEthereumLikeTransaction } from "./types";

export async function ethereumSignTransaction({
  transport,
  account,
  coreTransaction,
  subAccountId
}: {
  isCancelled: () => boolean,
  transport: Transport<*>,
  account: Account,
  currency: CryptoCurrency,
  subAccountId: ?string,
  coreCurrency: CoreCurrency,
  coreTransaction: CoreEthereumLikeTransaction
}) {
  const hwApp = new Eth(transport);
  const subAccount = subAccountId
    ? account.subAccounts &&
      account.subAccounts.find(t => t.id === subAccountId)
    : null;

  if (subAccount && subAccount.type === "TokenAccount") {
    const { token } = subAccount;
    const tokenInfo = byContractAddress(token.contractAddress);
    invariant(
      tokenInfo,
      `contract ${token.contractAddress} data for ${token.id} ERC20 not found`
    );
    await hwApp.provideERC20TokenInformation(tokenInfo);
  }

  const result = await hwApp.signTransaction(
    account.freshAddressPath,
    await coreTransaction.serialize()
  );

  await coreTransaction.setSignature(result.v, result.r, result.s);

  const raw = await coreTransaction.serialize();

  return raw;
}

export default ethereumSignTransaction;
