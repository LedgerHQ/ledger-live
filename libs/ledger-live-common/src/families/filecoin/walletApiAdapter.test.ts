import BigNumber from "bignumber.js";
import { FilecoinTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";

import filecoin from "./walletApiAdapter";

describe("getPlatformTransactionSignFlowInfo", () => {
  test("should handle transaction without fees provided", () => {
    const filecoinPlatformTx: WalletAPITransaction = {
      amount: new BigNumber(100004),
      data: new Buffer("example", "utf8"),
      family: "filecoin",
      method: 2,
      nonce: 1,
      params: "example",
      gasPremium: new BigNumber(100003),
      recipient: "0xABCDEF",
      version: 3,
    };

    const { canEditFees, hasFeesProvided, liveTx } =
      filecoin.getWalletAPITransactionSignFlowInfo(filecoinPlatformTx);

    expect(canEditFees).toBe(true);

    expect(hasFeesProvided).toBe(false);

    expect(liveTx).toEqual(filecoinPlatformTx);
  });

  test("should handle transaction with fees provided", () => {
    const filecoinPlatformTx: WalletAPITransaction = {
      amount: new BigNumber(100004),
      data: new Buffer("example", "utf8"),
      family: "filecoin",
      method: 2,
      nonce: 1,
      params: "example",
      gasLimit: new BigNumber(100001),
      gasFeeCap: new BigNumber(100002),
      gasPremium: new BigNumber(100003),
      recipient: "0xABCDEF",
      version: 3,
    };

    const { canEditFees, hasFeesProvided, liveTx } =
      filecoin.getWalletAPITransactionSignFlowInfo(filecoinPlatformTx);

    expect(canEditFees).toBe(true);

    expect(hasFeesProvided).toBe(true);

    expect(liveTx).toEqual(filecoinPlatformTx);
  });
});
