import adapter from "./walletApiAdapter";
import { CosmosTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";

function createTx(
  params: Partial<WalletAPITransaction> = {}
): WalletAPITransaction {
  return {
    family: "cosmos",
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
        canEditFees: true,
        hasFeesProvided: false,
        liveTx: tx,
      });
    });

    test("with fees", () => {
      const tx = createTx({ fees: new BigNumber(100) });
      const res = adapter.getWalletAPITransactionSignFlowInfos(tx);

      expect(res).toEqual({
        canEditFees: true,
        hasFeesProvided: true,
        liveTx: tx,
      });
    });
  });
});
