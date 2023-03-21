import adapter from "./walletApiAdapter";
import { NeoTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";

function createTx(
  params: Partial<WalletAPITransaction> = {}
): WalletAPITransaction {
  return {
    family: "neo",
    amount: new BigNumber(100000),
    recipient: "0xABCDEF",
    ...params,
  };
}

describe("getWalletAPITransactionSignFlowInfos", () => {
  const tx = createTx();

  it("should properly get infos for Wallet API tx", () => {
    const res = adapter.getWalletAPITransactionSignFlowInfos(tx);

    expect(res).toEqual({
      canEditFees: false,
      hasFeesProvided: false,
      liveTx: tx,
    });
  });
});
