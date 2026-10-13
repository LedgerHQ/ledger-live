import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import adapter from "./walletApiAdapter";

const account = { type: "Account" } as Account;

describe("zcash walletApiAdapter", () => {
  it("turns a live app's bitcoin transaction into a transparent Zcash send", () => {
    const { liveTx } = adapter.getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: {
        family: "bitcoin",
        amount: new BigNumber(150_000),
        recipient: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
      },
      account,
    });

    expect(liveTx).toMatchObject({
      family: "zcash",
      transferType: "transparent",
      amount: new BigNumber(150_000),
      recipient: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
    });
  });

  it("ignores a fee the app passes: ZIP-317 sets it", () => {
    const infos = adapter.getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: {
        family: "bitcoin",
        amount: new BigNumber(1),
        recipient: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
        feePerByte: new BigNumber(50),
      },
      account,
    });

    expect(infos.canEditFees).toBe(false);
    expect(infos.hasFeesProvided).toBe(false);
    expect(infos.liveTx).not.toHaveProperty("feePerByte");
  });
});
