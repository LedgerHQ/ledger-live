import adapter from "./walletApiAdapter";
import { SolanaTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";

function createTx(): WalletAPITransaction {
  return {
    family: "solana",
    amount: new BigNumber(100000),
    recipient: "4sko",
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
