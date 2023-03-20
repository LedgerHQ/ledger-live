import BigNumber from "bignumber.js";
import { CeloTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";

import celo from "./walletApiAdapter";

describe("getPlatformTransactionSignFlowInfo", () => {
  test("should handle transaction without fees provided", () => {
    const celoPlatformTx: WalletAPITransaction = {
      amount: new BigNumber(100004),
      family: "celo",
      index: 1,
      mode: "send",
      recipient: "0xABCDEF",
    };

    const { canEditFees, hasFeesProvided, liveTx } =
      celo.getWalletAPITransactionSignFlowInfo(celoPlatformTx);

    expect(canEditFees).toBe(true);

    expect(hasFeesProvided).toBe(false);

    expect(liveTx).toEqual(celoPlatformTx);
  });

  test("should handle transaction with fees provided", () => {
    const celoPlatformTx: WalletAPITransaction = {
      amount: new BigNumber(100004),
      family: "celo",
      fees: new BigNumber(10),
      index: 1,
      mode: "send",
      recipient: "0xABCDEF",
    };

    const { canEditFees, hasFeesProvided, liveTx } =
      celo.getWalletAPITransactionSignFlowInfo(celoPlatformTx);

    expect(canEditFees).toBe(true);

    expect(hasFeesProvided).toBe(true);

    expect(liveTx).toEqual(celoPlatformTx);
  });
});
