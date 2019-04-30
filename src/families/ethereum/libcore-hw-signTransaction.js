// @flow

import invariant from "invariant";
import Eth from "@ledgerhq/hw-app-eth";
import Transport from "@ledgerhq/hw-transport";
import { byContractAddress } from "@ledgerhq/hw-app-eth/erc20";
import type { CryptoCurrency, Account, TokenAccount } from "../../types";
import type {
  CoreCurrency,
  CoreEthereumLikeTransaction
} from "../../libcore/types";

export async function ethereumSignTransaction({
  transport,
  account,
  tokenAccount,
  coreTransaction
}: {
  isCancelled: () => boolean,
  transport: Transport<*>,
  account: Account,
  tokenAccount: ?TokenAccount,
  currency: CryptoCurrency,
  coreCurrency: CoreCurrency,
  coreTransaction: CoreEthereumLikeTransaction
}) {
  const hwApp = new Eth(transport);

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
