import BigNumber from "bignumber.js";
import { HederaTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";

import hedera from "./walletApiAdapter";

describe("getPlatformTransactionSignFlowInfo", () => {
  test("should handle transaction transformation", () => {
    const hederaPlatformTx: WalletAPITransaction = {
      amount: new BigNumber(100004),
      family: "hedera",
      memo: "example memo",
      recipient: "0xABCDEF",
    };

    const { canEditFees, hasFeesProvided, liveTx } =
      hedera.getWalletAPITransactionSignFlowInfo(hederaPlatformTx);

    expect(canEditFees).toBe(true);

    expect(hasFeesProvided).toBe(false);

    expect(liveTx).toEqual(hederaPlatformTx);
  });
});
