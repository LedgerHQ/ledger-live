import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getBalance, getBlockHeight } from "../network/node";

export const getAccountShape: GetAccountShape = async info => {
  const { address, currency, derivationMode } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // Get current block height
  const blockHeight = await getBlockHeight();

  // Get pathUSD (TIP-20) balance — this is the "native" balance on Tempo
  // since there is no native gas token
  const rawBalance = await getBalance(address);
  const balance = new BigNumber(rawBalance.toString());
  const spendableBalance = balance;

  // For hackathon simplicity, we skip operation history fetching.
  // Operations would normally come from an indexer.
  const operations = info.initialAccount?.operations || [];

  const shape = {
    id: accountId,
    xpub: address,
    blockHeight,
    balance,
    spendableBalance,
    operations,
    operationsCount: operations.length,
  };

  return shape;
};
