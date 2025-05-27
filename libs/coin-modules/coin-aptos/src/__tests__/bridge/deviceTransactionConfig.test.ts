import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import getDeviceTransactionConfig from "../../bridge/deviceTransactionConfig";
import { APTOS_PRECISION } from "../../constants";

describe("deviceTransactionConfig", () => {
  test("send", () => {
    const account = createFixtureAccount();
    const parentAccount = null;
    const transaction = createFixtureTransaction({
      amount: BigNumber(123).shiftedBy(APTOS_PRECISION),
    });
    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
    });

    expect(fields).toMatchObject([
      {
        type: "text",
        label: "Amount",
        value: "123 APT",
      },
    ]);
  });
});
