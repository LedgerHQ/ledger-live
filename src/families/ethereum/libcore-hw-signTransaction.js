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
  tokenAccountId
}: {
  isCancelled: () => boolean,
  transport: Transport<*>,
  account: Account,
  currency: CryptoCurrency,
  tokenAccountId: ?string,
  coreCurrency: CoreCurrency,
  coreTransaction: CoreEthereumLikeTransaction
}) {
  const hwApp = new Eth(transport);
  const tokenAccount = tokenAccountId
    ? account.tokenAccounts &&
      account.tokenAccounts.find(t => t.id === tokenAccountId)
    : null;

  if (tokenAccount) {
    const { token } = tokenAccount;
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
