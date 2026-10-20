/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { Account } from "@ledgerhq/types-live";
import type { HederaTransaction as WalletAPIHederaTransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import hedera from "./walletApiAdapter";

describe("hedera getWalletAPITransactionSignFlowInfos", () => {
  it("maps the wallet API memo to the generic memo fields", () => {
    const walletApiTransaction: WalletAPIHederaTransaction = {
      family: "hedera",
      amount: new BigNumber(100),
      recipient: "0.0.1234",
      memo: "123456",
    };

    const { canEditFees, hasFeesProvided, liveTx } = hedera.getWalletAPITransactionSignFlowInfos({
      walletApiTransaction,
      account: {} as Account,
    });

    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual({
      family: "hedera",
      amount: new BigNumber(100),
      recipient: "0.0.1234",
      memoType: "string",
      memoValue: "123456",
    });
  });

  it("leaves the memo fields unset without a memo", () => {
    const { liveTx } = hedera.getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: {
        family: "hedera",
        amount: new BigNumber(100),
        recipient: "0.0.1234",
      },
      account: {} as Account,
    });

    expect(liveTx).toEqual({
      family: "hedera",
      amount: new BigNumber(100),
      recipient: "0.0.1234",
    });
  });
});
