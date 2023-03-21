import adapter from "./walletApiAdapter";
import { TronTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";

function createTx(
  params: Partial<WalletAPITransaction> = {}
): WalletAPITransaction {
  return {
    family: "tron",
    amount: new BigNumber(100000),
    recipient: "0xABCDEF",
    mode: "send",
    ...params,
  };
}

describe("getPlatformTransactionSignFlowInfos", () => {
  describe("should properly get infos for wallet API tx", () => {
    test("without fees", () => {
      const tx = createTx();
      const res = adapter.getWalletAPITransactionSignFlowInfos(tx);

      expect(res).toEqual({
        canEditFees: false,
        hasFeesProvided: false,
        liveTx: tx,
      });
    });
  });
});
