import adapter from "./walletApiAdapter";
import { ElrondTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";

function createTx(): WalletAPITransaction {
  return {
    family: "elrond",
    amount: new BigNumber(100000),
    recipient: "4sko",
    fees: new BigNumber(100),
  };
}

describe("getWalletAPITransactionSignFlowInfos", () => {
  const tx = createTx();

  it("should properly get infos for Wallet API tx", () => {
    const res = adapter.getWalletAPITransactionSignFlowInfos(tx);

    expect(res).toEqual({
      canEditFees: false,
      hasFeesProvided: true,
      liveTx: tx,
    });
  });
});
